// =============================================================================
// Core Domain Types — Arrivia Travel Recommendations API
// =============================================================================

// --- Enums & Literal Types ---

export type BookingType = 'flight' | 'hotel' | 'rental_car' | 'cruise' | 'package';

export type LoyaltyTier = 'Silver' | 'Gold' | 'Platinum';

export type BudgetLevel = 'economy' | 'mid-range' | 'luxury';

export type TravelStyle = 'adventure' | 'relaxation' | 'cultural' | 'business';

// --- Member-Related Types ---

export interface Booking {
  destination: string;
  region: string;
  dates: { start: string; end: string };
  bookingType: BookingType;
  rating?: number;
}

export interface TravelPreferences {
  preferredRegions?: string[];
  budgetLevel?: BudgetLevel;
  travelStyle?: TravelStyle;
}

export interface Member {
  memberId: string;
  loyaltyTier: LoyaltyTier;
  partnerId: string;
  travelHistory: Booking[];
  preferences?: TravelPreferences;
}

// --- Partner Configuration Types ---

export interface TierBenefit {
  priorityAccess: boolean;
  discountPercentage: number;
  exclusiveDeals: boolean;
}

export interface PartnerConfig {
  partnerId: string;
  partnerName: string;
  maxRecommendationsPerSession: number | null;
  excludedBookingTypes: BookingType[];
  allowedRegions?: string[];
  tierBenefits: Record<LoyaltyTier, TierBenefit>;
  brandingConfig?: {
    displayName: string;
    theme: string;
  };
}

// --- Recommendation Types ---

export interface Recommendation {
  id: string;
  destination: string;
  region: string;
  bookingType: BookingType;
  title: string;
  description: string;
  estimatedPrice: { amount: number; currency: string };
  confidenceScore: number;
  reasoning: string;
  loyaltyPointsEarned?: number;
  tierExclusive: boolean;
}

export interface RecommendationRequest {
  memberId: string;
  destinationPreference?: string;
  bookingTypePreference?: BookingType;
  budgetMax?: number;
  sessionId?: string;
}

export interface RecommendationResponse {
  memberId: string;
  partnerId: string;
  partnerName: string;
  loyaltyTier: LoyaltyTier;
  recommendations: Recommendation[];
  metadata: {
    totalGenerated: number;
    totalAfterFiltering: number;
    appliedRules: string[];
    generatedAt: string;
  };
}

// --- Travel Inventory Item (used internally by the recommendation engine) ---

export interface TravelInventoryItem {
  id: string;
  destination: string;
  region: string;
  bookingType: BookingType;
  title: string;
  description: string;
  estimatedPrice: { amount: number; currency: string };
  travelStyle: TravelStyle;
  seasonalMonths?: number[];
  loyaltyPointsEarned: number;
  tierMinimum?: LoyaltyTier;
}

// --- Service Interfaces ---

/**
 * Interface for member data access.
 * In production, this would make HTTP calls to the member service.
 */
export interface IMemberService {
  getMember(memberId: string): Promise<Member>;
}

/**
 * Interface for partner configuration access.
 * IMPORTANT: This is READ-ONLY per project constraints (Constraint 2).
 * We can ONLY read config. We cannot modify, update, or write partner rules.
 * Partner config is owned by another team's service.
 */
export interface IPartnerConfigService {
  getPartnerConfig(partnerId: string): Promise<PartnerConfig>;
  // NO write methods. Partner config is owned by another team's service.
}

/**
 * Interface for the recommendation engine.
 */
export interface IRecommendationEngine {
  generateRecommendations(
    member: Member,
    request: RecommendationRequest
  ): Promise<Recommendation[]>;
}

/**
 * Interface for the rule enforcer.
 */
export interface IRuleEnforcer {
  applyRules(
    recommendations: Recommendation[],
    partnerConfig: PartnerConfig,
    memberTier: LoyaltyTier
  ): RuleEnforcementResult;
}

export interface RuleEnforcementResult {
  recommendations: Recommendation[];
  appliedRules: string[];
  totalBefore: number;
  totalAfter: number;
}

// --- Error Types ---

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class MemberNotFoundError extends AppError {
  constructor(memberId: string) {
    super('MEMBER_NOT_FOUND', `No member found with ID ${memberId}`, 404);
    this.name = 'MemberNotFoundError';
  }
}

export class PartnerConfigNotFoundError extends AppError {
  constructor(partnerId: string) {
    super('PARTNER_CONFIG_NOT_FOUND', `No partner configuration found for partner ${partnerId}`, 404);
    this.name = 'PartnerConfigNotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class ServiceTimeoutError extends AppError {
  constructor(serviceName: string) {
    super('SERVICE_TIMEOUT', `Upstream service '${serviceName}' timed out`, 504);
    this.name = 'ServiceTimeoutError';
  }
}

// --- API Response Types ---

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    timestamp: string;
    requestId: string;
  };
}

export interface HealthResponse {
  status: 'healthy' | 'degraded';
  version: string;
  uptime: number;
  timestamp: string;
}
