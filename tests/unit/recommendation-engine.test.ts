import { RecommendationEngine } from '../../src/services/recommendation-engine';
import { Member, TravelInventoryItem, Recommendation } from '../../src/types';

// Minimal inventory for controlled testing
const testInventory: TravelInventoryItem[] = [
  {
    id: 'test_beach', destination: 'Cancún', region: 'Caribbean', bookingType: 'package',
    title: 'Beach Package', description: 'Beach trip',
    estimatedPrice: { amount: 1500, currency: 'USD' }, travelStyle: 'relaxation',
    seasonalMonths: [1, 2, 3, 12], loyaltyPointsEarned: 3000,
  },
  {
    id: 'test_city', destination: 'New York', region: 'US Domestic', bookingType: 'hotel',
    title: 'City Hotel', description: 'City stay',
    estimatedPrice: { amount: 800, currency: 'USD' }, travelStyle: 'business',
    seasonalMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], loyaltyPointsEarned: 1600,
  },
  {
    id: 'test_luxury', destination: 'Maldives', region: 'Asia-Pacific', bookingType: 'hotel',
    title: 'Luxury Overwater Villa', description: 'Luxury stay',
    estimatedPrice: { amount: 5000, currency: 'USD' }, travelStyle: 'relaxation',
    seasonalMonths: [1, 2, 3, 11, 12], loyaltyPointsEarned: 10000, tierMinimum: 'Platinum',
  },
  {
    id: 'test_budget', destination: 'Lisbon', region: 'Europe', bookingType: 'flight',
    title: 'Budget Flight to Lisbon', description: 'Cheap flight',
    estimatedPrice: { amount: 350, currency: 'USD' }, travelStyle: 'cultural',
    seasonalMonths: [4, 5, 9, 10], loyaltyPointsEarned: 700,
  },
  {
    id: 'test_cruise', destination: 'Mediterranean', region: 'Europe', bookingType: 'cruise',
    title: 'Med Cruise', description: 'Cruise trip',
    estimatedPrice: { amount: 3500, currency: 'USD' }, travelStyle: 'relaxation',
    seasonalMonths: [5, 6, 7, 8], loyaltyPointsEarned: 7000, tierMinimum: 'Gold',
  },
];

const beachMember: Member = {
  memberId: 'test_beach_person',
  loyaltyTier: 'Gold',
  partnerId: 'partner_luxbank',
  travelHistory: [
    { destination: 'Cancún', region: 'Caribbean', dates: { start: '2025-01-10', end: '2025-01-17' }, bookingType: 'package', rating: 5 },
    { destination: 'Aruba', region: 'Caribbean', dates: { start: '2024-12-10', end: '2024-12-17' }, bookingType: 'hotel', rating: 4 },
    { destination: 'Punta Cana', region: 'Caribbean', dates: { start: '2024-06-01', end: '2024-06-08' }, bookingType: 'package', rating: 5 },
  ],
  preferences: { preferredRegions: ['Caribbean'], budgetLevel: 'mid-range', travelStyle: 'relaxation' },
};

const platinumMember: Member = {
  memberId: 'test_platinum',
  loyaltyTier: 'Platinum',
  partnerId: 'partner_luxbank',
  travelHistory: [
    { destination: 'Paris', region: 'Europe', dates: { start: '2025-02-14', end: '2025-02-21' }, bookingType: 'hotel', rating: 5 },
  ],
  preferences: { preferredRegions: ['Europe'], budgetLevel: 'luxury', travelStyle: 'cultural' },
};

const emptyHistoryMember: Member = {
  memberId: 'test_new',
  loyaltyTier: 'Silver',
  partnerId: 'partner_valuemiles',
  travelHistory: [],
};

describe('RecommendationEngine', () => {
  const engine = new RecommendationEngine(testInventory);

  it('scores beach recommendations highest for a beach-loving member', async () => {
    const recs = await engine.generateRecommendations(beachMember, { memberId: beachMember.memberId });

    // The beach/Caribbean item should be among the top results
    const beachRec = recs.find((r) => r.id === 'test_beach');
    expect(beachRec).toBeDefined();

    // Beach rec should have a higher confidence than unrelated items
    const cityRec = recs.find((r) => r.id === 'test_city');
    expect(beachRec!.confidenceScore).toBeGreaterThan(cityRec?.confidenceScore ?? 0);
  });

  it('gives Platinum members access to luxury tier items', async () => {
    const recs = await engine.generateRecommendations(platinumMember, { memberId: platinumMember.memberId });

    const luxuryRec = recs.find((r) => r.id === 'test_luxury');
    expect(luxuryRec).toBeDefined();
    expect(luxuryRec!.tierExclusive).toBe(true);
  });

  it('excludes luxury tier items for Silver members', async () => {
    const recs = await engine.generateRecommendations(emptyHistoryMember, { memberId: emptyHistoryMember.memberId });

    const luxuryRec = recs.find((r) => r.id === 'test_luxury');
    expect(luxuryRec).toBeUndefined();
  });

  it('returns reasonable recommendations for a member with no history', async () => {
    const recs = await engine.generateRecommendations(emptyHistoryMember, { memberId: emptyHistoryMember.memberId });

    // Should still return some recommendations (the engine should handle empty history gracefully)
    expect(recs.length).toBeGreaterThan(0);
  });

  it('always produces confidence scores between 0 and 1', async () => {
    const recs = await engine.generateRecommendations(beachMember, { memberId: beachMember.memberId });

    for (const rec of recs) {
      expect(rec.confidenceScore).toBeGreaterThanOrEqual(0);
      expect(rec.confidenceScore).toBeLessThanOrEqual(1);
    }
  });

  it('includes reasoning for each recommendation', async () => {
    const recs = await engine.generateRecommendations(beachMember, { memberId: beachMember.memberId });

    for (const rec of recs) {
      expect(rec.reasoning).toBeTruthy();
      expect(typeof rec.reasoning).toBe('string');
    }
  });
});
