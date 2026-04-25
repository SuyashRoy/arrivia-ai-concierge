import { PartnerConfig } from '../types';

/**
 * Mock partner configurations with meaningfully different rules.
 *
 * In production these would come from the partner config service via HTTP.
 * Our service is READ-ONLY — we enforce whatever config we receive.
 */
export const MOCK_PARTNER_CONFIGS: Record<string, PartnerConfig> = {
  partner_luxbank: {
    partnerId: 'partner_luxbank',
    partnerName: 'LuxBank Travel',
    maxRecommendationsPerSession: 5,
    excludedBookingTypes: [],
    allowedRegions: undefined,
    tierBenefits: {
      Silver: { priorityAccess: false, discountPercentage: 0, exclusiveDeals: false },
      Gold: { priorityAccess: true, discountPercentage: 5, exclusiveDeals: false },
      Platinum: { priorityAccess: true, discountPercentage: 15, exclusiveDeals: true },
    },
    brandingConfig: { displayName: 'LuxBank Premium Travel', theme: 'dark-gold' },
  },

  partner_valuemiles: {
    partnerId: 'partner_valuemiles',
    partnerName: 'ValueMiles Club',
    maxRecommendationsPerSession: 3,
    excludedBookingTypes: ['cruise'],
    allowedRegions: undefined,
    tierBenefits: {
      Silver: { priorityAccess: false, discountPercentage: 2, exclusiveDeals: false },
      Gold: { priorityAccess: false, discountPercentage: 5, exclusiveDeals: false },
      Platinum: { priorityAccess: true, discountPercentage: 8, exclusiveDeals: true },
    },
    brandingConfig: { displayName: 'ValueMiles Travel Deals', theme: 'blue' },
  },

  partner_globalexplorer: {
    partnerId: 'partner_globalexplorer',
    partnerName: 'Global Explorer Card',
    maxRecommendationsPerSession: null, // unlimited
    excludedBookingTypes: ['rental_car'],
    allowedRegions: undefined,
    tierBenefits: {
      Silver: { priorityAccess: false, discountPercentage: 3, exclusiveDeals: false },
      Gold: { priorityAccess: true, discountPercentage: 7, exclusiveDeals: true },
      Platinum: { priorityAccess: true, discountPercentage: 12, exclusiveDeals: true },
    },
    brandingConfig: { displayName: 'Global Explorer Journeys', theme: 'green' },
  },

  partner_coastalcu: {
    partnerId: 'partner_coastalcu',
    partnerName: 'Coastal Credit Union',
    maxRecommendationsPerSession: 4,
    excludedBookingTypes: ['cruise', 'package'],
    allowedRegions: ['US Domestic'],
    tierBenefits: {
      Silver: { priorityAccess: false, discountPercentage: 1, exclusiveDeals: false },
      Gold: { priorityAccess: false, discountPercentage: 3, exclusiveDeals: false },
      Platinum: { priorityAccess: true, discountPercentage: 6, exclusiveDeals: true },
    },
    brandingConfig: { displayName: 'Coastal Travel Rewards', theme: 'ocean-blue' },
  },
};
