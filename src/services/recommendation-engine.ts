import {
  IRecommendationEngine,
  Member,
  Recommendation,
  RecommendationRequest,
  TravelInventoryItem,
  BookingType,
  LoyaltyTier,
} from '../types';
import { TRAVEL_INVENTORY } from '../mocks/travel-inventory';
import { logger } from '../utils/logger';

// --- Scoring Weights ---
const WEIGHT_REGION_MATCH = 30;
const WEIGHT_BOOKING_TYPE_MATCH = 20;
const WEIGHT_SEASONAL_RELEVANCE = 15;
const WEIGHT_TIER_PRICING = 20;
const WEIGHT_NOVELTY = 15;
const MAX_SCORE = WEIGHT_REGION_MATCH + WEIGHT_BOOKING_TYPE_MATCH + WEIGHT_SEASONAL_RELEVANCE + WEIGHT_TIER_PRICING + WEIGHT_NOVELTY;

/** Price ranges considered appropriate for each loyalty tier. */
const TIER_PRICE_RANGES: Record<LoyaltyTier, { min: number; max: number }> = {
  Silver: { min: 0, max: 1000 },
  Gold: { min: 500, max: 3000 },
  Platinum: { min: 1500, max: 10000 },
};

/**
 * Rule-based recommendation engine.
 *
 * Scores each travel inventory item against the member's profile using
 * a simple weighted model. No ML — this is deliberate for debuggability
 * at 2am (Constraint 4) and four-week scope (Constraint 3).
 *
 * Scoring breakdown:
 *   Region match:        +30 (matches member's most-visited region)
 *   Booking type match:  +20 (matches member's preferred booking type)
 *   Seasonal relevance:  +15 (aligns with their typical travel months)
 *   Tier-appropriate $:  +20 (price is in range for their loyalty tier)
 *   Novelty bonus:       +15 (destination they haven't visited before)
 */
export class RecommendationEngine implements IRecommendationEngine {
  private readonly inventory: TravelInventoryItem[];

  constructor(inventory?: TravelInventoryItem[]) {
    this.inventory = inventory ?? TRAVEL_INVENTORY;
  }

  /** Generates scored recommendations for a member, sorted by confidence. */
  async generateRecommendations(
    member: Member,
    request: RecommendationRequest
  ): Promise<Recommendation[]> {
    const start = Date.now();

    const profile = this.analyzeProfile(member);
    const scored = this.inventory
      .map((item) => this.scoreItem(item, member, profile, request))
      .filter((entry): entry is ScoredItem => entry !== null)
      .sort((a, b) => b.score - a.score);

    const recommendations = scored.map((s) => this.toRecommendation(s));

    logger.info('Recommendations generated', {
      memberId: member.memberId,
      partnerId: member.partnerId,
      totalInventory: this.inventory.length,
      totalScored: recommendations.length,
      durationMs: Date.now() - start,
    });

    return recommendations;
  }

  // ---------------------------------------------------------------------------
  // Step 1 — Analyze member travel patterns
  // ---------------------------------------------------------------------------

  private analyzeProfile(member: Member): MemberProfile {
    const regionCounts: Record<string, number> = {};
    const bookingTypeCounts: Record<string, number> = {};
    const travelMonths: number[] = [];
    const visitedDestinations = new Set<string>();

    for (const booking of member.travelHistory) {
      regionCounts[booking.region] = (regionCounts[booking.region] ?? 0) + 1;
      bookingTypeCounts[booking.bookingType] = (bookingTypeCounts[booking.bookingType] ?? 0) + 1;
      visitedDestinations.add(booking.destination);

      const startMonth = new Date(booking.dates.start).getMonth() + 1;
      travelMonths.push(startMonth);
    }

    const topRegions = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([region]) => region);

    const topBookingTypes = Object.entries(bookingTypeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([type]) => type as BookingType);

    return {
      topRegions,
      topBookingTypes,
      travelMonths,
      visitedDestinations,
      tier: member.loyaltyTier,
    };
  }

  // ---------------------------------------------------------------------------
  // Step 2 — Score each inventory item
  // ---------------------------------------------------------------------------

  private scoreItem(
    item: TravelInventoryItem,
    member: Member,
    profile: MemberProfile,
    request: RecommendationRequest
  ): ScoredItem | null {
    // Skip items that require a higher tier than the member has
    if (item.tierMinimum && !this.meetsTierRequirement(member.loyaltyTier, item.tierMinimum)) {
      return null;
    }

    let score = 0;
    const reasons: string[] = [];

    // --- Region match ---
    const regionRank = profile.topRegions.indexOf(item.region);
    if (regionRank === 0) {
      score += WEIGHT_REGION_MATCH;
      reasons.push(`Top region match (${item.region})`);
    } else if (regionRank > 0) {
      score += WEIGHT_REGION_MATCH * 0.5;
      reasons.push(`Region visited before (${item.region})`);
    } else if (request.destinationPreference && item.destination.toLowerCase().includes(request.destinationPreference.toLowerCase())) {
      score += WEIGHT_REGION_MATCH * 0.7;
      reasons.push(`Matches destination preference "${request.destinationPreference}"`);
    }

    // If the member explicitly prefers certain regions via preferences
    if (member.preferences?.preferredRegions?.includes(item.region)) {
      score += WEIGHT_REGION_MATCH * 0.3;
      reasons.push(`In preferred regions`);
    }

    // --- Booking type match ---
    const typeRank = profile.topBookingTypes.indexOf(item.bookingType);
    if (request.bookingTypePreference && item.bookingType === request.bookingTypePreference) {
      score += WEIGHT_BOOKING_TYPE_MATCH;
      reasons.push(`Matches requested booking type`);
    } else if (typeRank === 0) {
      score += WEIGHT_BOOKING_TYPE_MATCH;
      reasons.push(`Preferred booking type (${item.bookingType})`);
    } else if (typeRank > 0) {
      score += WEIGHT_BOOKING_TYPE_MATCH * 0.5;
      reasons.push(`Used booking type before`);
    }

    // --- Seasonal relevance ---
    if (item.seasonalMonths && item.seasonalMonths.length > 0) {
      const currentMonth = new Date().getMonth() + 1;
      const isCurrentSeason = item.seasonalMonths.includes(currentMonth);
      const matchesTravelPattern = profile.travelMonths.some((m) => item.seasonalMonths!.includes(m));

      if (isCurrentSeason) {
        score += WEIGHT_SEASONAL_RELEVANCE;
        reasons.push(`In season now`);
      } else if (matchesTravelPattern) {
        score += WEIGHT_SEASONAL_RELEVANCE * 0.5;
        reasons.push(`Matches typical travel months`);
      }
    }

    // --- Tier-appropriate pricing ---
    const priceRange = TIER_PRICE_RANGES[profile.tier];
    const price = item.estimatedPrice.amount;
    if (request.budgetMax && price <= request.budgetMax) {
      score += WEIGHT_TIER_PRICING;
      reasons.push(`Within budget cap ($${request.budgetMax})`);
    } else if (price >= priceRange.min && price <= priceRange.max) {
      score += WEIGHT_TIER_PRICING;
      reasons.push(`Price appropriate for ${profile.tier} tier`);
    } else if (price < priceRange.min) {
      score += WEIGHT_TIER_PRICING * 0.3;
      reasons.push(`Below typical tier price range`);
    }

    // --- Novelty bonus ---
    if (!profile.visitedDestinations.has(item.destination)) {
      score += WEIGHT_NOVELTY;
      reasons.push(`New destination (novelty bonus)`);
    }

    // Normalize to 0-1
    const confidence = Math.min(score / MAX_SCORE, 1);

    return { item, score, confidence, reasons };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  private meetsTierRequirement(memberTier: LoyaltyTier, requiredTier: LoyaltyTier): boolean {
    const tierOrder: LoyaltyTier[] = ['Silver', 'Gold', 'Platinum'];
    return tierOrder.indexOf(memberTier) >= tierOrder.indexOf(requiredTier);
  }

  private toRecommendation(scored: ScoredItem): Recommendation {
    const { item, confidence, reasons } = scored;
    return {
      id: item.id,
      destination: item.destination,
      region: item.region,
      bookingType: item.bookingType,
      title: item.title,
      description: item.description,
      estimatedPrice: item.estimatedPrice,
      confidenceScore: Math.round(confidence * 100) / 100,
      reasoning: reasons.join('; '),
      loyaltyPointsEarned: item.loyaltyPointsEarned,
      tierExclusive: item.tierMinimum !== undefined,
    };
  }
}

// --- Internal Types ---

interface MemberProfile {
  topRegions: string[];
  topBookingTypes: BookingType[];
  travelMonths: number[];
  visitedDestinations: Set<string>;
  tier: LoyaltyTier;
}

interface ScoredItem {
  item: TravelInventoryItem;
  score: number;
  confidence: number;
  reasons: string[];
}
