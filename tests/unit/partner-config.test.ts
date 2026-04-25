import { MockPartnerConfigService } from '../../src/services/partner-config-service';
import { PartnerConfigNotFoundError } from '../../src/types';
import { MOCK_PARTNER_CONFIGS } from '../../src/mocks/partner-config-data';

describe('PartnerConfigService', () => {
  const service = new MockPartnerConfigService(1000);

  it('returns valid config for each known partner', async () => {
    for (const partnerId of Object.keys(MOCK_PARTNER_CONFIGS)) {
      const config = await service.getPartnerConfig(partnerId);

      expect(config.partnerId).toBe(partnerId);
      expect(config.partnerName).toBeTruthy();
      expect(config.tierBenefits).toBeDefined();
      expect(config.tierBenefits.Silver).toBeDefined();
      expect(config.tierBenefits.Gold).toBeDefined();
      expect(config.tierBenefits.Platinum).toBeDefined();
      expect(Array.isArray(config.excludedBookingTypes)).toBe(true);

      // maxRecommendationsPerSession is either null or a non-negative number
      if (config.maxRecommendationsPerSession !== null) {
        expect(config.maxRecommendationsPerSession).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('throws PartnerConfigNotFoundError for unknown partner ID', async () => {
    await expect(service.getPartnerConfig('partner_nonexistent'))
      .rejects.toThrow(PartnerConfigNotFoundError);
  });

  it('throws PartnerConfigNotFoundError with correct message', async () => {
    try {
      await service.getPartnerConfig('partner_unknown');
      fail('Should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(PartnerConfigNotFoundError);
      expect((err as PartnerConfigNotFoundError).code).toBe('PARTNER_CONFIG_NOT_FOUND');
      expect((err as PartnerConfigNotFoundError).statusCode).toBe(404);
    }
  });

  it('has at least 3 partner configurations', () => {
    expect(Object.keys(MOCK_PARTNER_CONFIGS).length).toBeGreaterThanOrEqual(3);
  });

  it('has a partner that excludes cruises (for testing exclusion rules)', () => {
    const hasCruiseExclusion = Object.values(MOCK_PARTNER_CONFIGS).some(
      (config) => config.excludedBookingTypes.includes('cruise')
    );
    expect(hasCruiseExclusion).toBe(true);
  });

  it('has a partner with unlimited recommendations (null cap)', () => {
    const hasUnlimited = Object.values(MOCK_PARTNER_CONFIGS).some(
      (config) => config.maxRecommendationsPerSession === null
    );
    expect(hasUnlimited).toBe(true);
  });

  it('has a partner with region restrictions', () => {
    const hasRegionRestriction = Object.values(MOCK_PARTNER_CONFIGS).some(
      (config) => config.allowedRegions && config.allowedRegions.length > 0
    );
    expect(hasRegionRestriction).toBe(true);
  });
});
