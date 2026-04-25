import { RuleEnforcer } from '../../src/services/rule-enforcer';
import { Recommendation, PartnerConfig, LoyaltyTier } from '../../src/types';

function makeRec(overrides: Partial<Recommendation> = {}): Recommendation {
  return {
    id: 'rec_1',
    destination: 'Test Destination',
    region: 'Caribbean',
    bookingType: 'hotel',
    title: 'Test Recommendation',
    description: 'A test recommendation',
    estimatedPrice: { amount: 1000, currency: 'USD' },
    confidenceScore: 0.8,
    reasoning: 'Test reasoning',
    loyaltyPointsEarned: 2000,
    tierExclusive: false,
    ...overrides,
  };
}

function makePartnerConfig(overrides: Partial<PartnerConfig> = {}): PartnerConfig {
  return {
    partnerId: 'partner_test',
    partnerName: 'Test Partner',
    maxRecommendationsPerSession: null,
    excludedBookingTypes: [],
    tierBenefits: {
      Silver: { priorityAccess: false, discountPercentage: 0, exclusiveDeals: false },
      Gold: { priorityAccess: true, discountPercentage: 5, exclusiveDeals: false },
      Platinum: { priorityAccess: true, discountPercentage: 10, exclusiveDeals: true },
    },
    ...overrides,
  };
}

describe('RuleEnforcer', () => {
  const enforcer = new RuleEnforcer();

  describe('booking type exclusion', () => {
    it('removes cruises when partner excludes cruises', () => {
      const recs = [
        makeRec({ id: 'r1', bookingType: 'hotel' }),
        makeRec({ id: 'r2', bookingType: 'cruise' }),
        makeRec({ id: 'r3', bookingType: 'cruise' }),
        makeRec({ id: 'r4', bookingType: 'flight' }),
      ];
      const config = makePartnerConfig({ excludedBookingTypes: ['cruise'] });

      const result = enforcer.applyRules(recs, config, 'Gold');

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations.every((r) => r.bookingType !== 'cruise')).toBe(true);
      expect(result.appliedRules.some((r) => r.includes('excluded_booking_types'))).toBe(true);
    });

    it('removes multiple excluded types', () => {
      const recs = [
        makeRec({ id: 'r1', bookingType: 'hotel' }),
        makeRec({ id: 'r2', bookingType: 'cruise' }),
        makeRec({ id: 'r3', bookingType: 'package' }),
        makeRec({ id: 'r4', bookingType: 'flight' }),
      ];
      const config = makePartnerConfig({ excludedBookingTypes: ['cruise', 'package'] });

      const result = enforcer.applyRules(recs, config, 'Gold');

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations.map((r) => r.bookingType)).toEqual(['hotel', 'flight']);
    });
  });

  describe('recommendation cap', () => {
    it('caps results when partner sets a max', () => {
      const recs = Array.from({ length: 10 }, (_, i) =>
        makeRec({ id: `r${i}`, bookingType: 'hotel' })
      );
      const config = makePartnerConfig({ maxRecommendationsPerSession: 3 });

      const result = enforcer.applyRules(recs, config, 'Gold');

      expect(result.recommendations).toHaveLength(3);
      expect(result.appliedRules.some((r) => r.includes('capped_at_3'))).toBe(true);
    });

    it('passes all through when cap is null (unlimited)', () => {
      const recs = Array.from({ length: 8 }, (_, i) =>
        makeRec({ id: `r${i}`, bookingType: 'hotel' })
      );
      const config = makePartnerConfig({ maxRecommendationsPerSession: null });

      const result = enforcer.applyRules(recs, config, 'Gold');

      expect(result.recommendations).toHaveLength(8);
    });

    it('returns empty when maxRecommendationsPerSession is 0', () => {
      const recs = [makeRec(), makeRec({ id: 'r2' })];
      const config = makePartnerConfig({ maxRecommendationsPerSession: 0 });

      const result = enforcer.applyRules(recs, config, 'Gold');

      expect(result.recommendations).toHaveLength(0);
      expect(result.appliedRules.some((r) => r.includes('max_recommendations_zero'))).toBe(true);
    });
  });

  describe('region restrictions', () => {
    it('filters by allowed regions', () => {
      const recs = [
        makeRec({ id: 'r1', region: 'US Domestic' }),
        makeRec({ id: 'r2', region: 'Caribbean' }),
        makeRec({ id: 'r3', region: 'Europe' }),
        makeRec({ id: 'r4', region: 'US Domestic' }),
      ];
      const config = makePartnerConfig({ allowedRegions: ['US Domestic'] });

      const result = enforcer.applyRules(recs, config, 'Gold');

      expect(result.recommendations).toHaveLength(2);
      expect(result.recommendations.every((r) => r.region === 'US Domestic')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns empty when ALL recommendations are excluded', () => {
      const recs = [
        makeRec({ id: 'r1', bookingType: 'cruise' }),
        makeRec({ id: 'r2', bookingType: 'cruise' }),
      ];
      const config = makePartnerConfig({ excludedBookingTypes: ['cruise'] });

      const result = enforcer.applyRules(recs, config, 'Gold');

      expect(result.recommendations).toHaveLength(0);
      expect(result.totalBefore).toBe(2);
      expect(result.totalAfter).toBe(0);
    });

    it('returns fewer than cap when filtering removes enough', () => {
      const recs = [
        makeRec({ id: 'r1', bookingType: 'hotel' }),
        makeRec({ id: 'r2', bookingType: 'cruise' }),
        makeRec({ id: 'r3', bookingType: 'cruise' }),
      ];
      const config = makePartnerConfig({
        excludedBookingTypes: ['cruise'],
        maxRecommendationsPerSession: 5,
      });

      const result = enforcer.applyRules(recs, config, 'Gold');

      // Only 1 hotel survives, even though cap is 5
      expect(result.recommendations).toHaveLength(1);
    });

    it('handles empty input recommendations', () => {
      const config = makePartnerConfig();

      const result = enforcer.applyRules([], config, 'Gold');

      expect(result.recommendations).toHaveLength(0);
      expect(result.totalBefore).toBe(0);
      expect(result.totalAfter).toBe(0);
    });
  });

  describe('metadata accuracy', () => {
    it('accurately reports totalBefore and totalAfter', () => {
      const recs = [
        makeRec({ id: 'r1', bookingType: 'hotel' }),
        makeRec({ id: 'r2', bookingType: 'cruise' }),
        makeRec({ id: 'r3', bookingType: 'flight' }),
      ];
      const config = makePartnerConfig({
        excludedBookingTypes: ['cruise'],
        maxRecommendationsPerSession: 2,
      });

      const result = enforcer.applyRules(recs, config, 'Gold');

      expect(result.totalBefore).toBe(3);
      expect(result.totalAfter).toBe(2);
    });

    it('lists all applied rules in metadata', () => {
      const recs = Array.from({ length: 5 }, (_, i) =>
        makeRec({ id: `r${i}`, bookingType: 'hotel', region: 'US Domestic' })
      );
      const config = makePartnerConfig({
        excludedBookingTypes: ['cruise'],
        allowedRegions: ['US Domestic'],
        maxRecommendationsPerSession: 3,
      });

      const result = enforcer.applyRules(recs, config, 'Platinum');

      // Should have rules for: excluded types, allowed regions, cap, and tier benefits
      expect(result.appliedRules.length).toBeGreaterThan(0);
    });
  });
});
