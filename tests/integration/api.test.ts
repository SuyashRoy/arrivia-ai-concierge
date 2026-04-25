import request from 'supertest';
import { createApp } from '../../src/server';

const app = createApp();

describe('API Integration Tests', () => {
  describe('GET /health', () => {
    it('returns 200 with healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.version).toBe('1.0.0');
      expect(typeof res.body.uptime).toBe('number');
      expect(res.body.timestamp).toBeTruthy();
    });
  });

  describe('GET /api/members/:memberId', () => {
    it('returns member profile for a valid member', async () => {
      const res = await request(app).get('/api/members/mem_001');

      expect(res.status).toBe(200);
      expect(res.body.memberId).toBe('mem_001');
      expect(res.body.loyaltyTier).toBeTruthy();
      expect(res.body.partnerId).toBeTruthy();
      expect(Array.isArray(res.body.travelHistory)).toBe(true);
    });

    it('returns 404 for invalid member ID', async () => {
      const res = await request(app).get('/api/members/mem_999');

      expect(res.status).toBe(404);
      expect(res.body.error).toBeDefined();
      expect(res.body.error.code).toBe('MEMBER_NOT_FOUND');
      expect(res.body.error.requestId).toBeTruthy();
      expect(res.body.error.timestamp).toBeTruthy();
    });
  });

  describe('POST /api/recommendations', () => {
    it('returns recommendations for a valid member', async () => {
      const res = await request(app)
        .post('/api/recommendations')
        .send({ memberId: 'mem_001' });

      expect(res.status).toBe(200);
      expect(res.body.memberId).toBe('mem_001');
      expect(res.body.partnerId).toBeTruthy();
      expect(res.body.partnerName).toBeTruthy();
      expect(res.body.loyaltyTier).toBeTruthy();
      expect(Array.isArray(res.body.recommendations)).toBe(true);
      expect(res.body.metadata).toBeDefined();
      expect(typeof res.body.metadata.totalGenerated).toBe('number');
      expect(typeof res.body.metadata.totalAfterFiltering).toBe('number');
      expect(Array.isArray(res.body.metadata.appliedRules)).toBe(true);
    });

    it('returns 404 for invalid member ID', async () => {
      const res = await request(app)
        .post('/api/recommendations')
        .send({ memberId: 'mem_nonexistent' });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('MEMBER_NOT_FOUND');
    });

    it('returns 400 when memberId is missing', async () => {
      const res = await request(app)
        .post('/api/recommendations')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('enforces partner cruise exclusion rules', async () => {
      // mem_007 is a cruise enthusiast in partner_valuemiles which excludes cruises
      const res = await request(app)
        .post('/api/recommendations')
        .send({ memberId: 'mem_007' });

      expect(res.status).toBe(200);
      // ValueMiles excludes cruises — no cruise recs should appear
      const hasCruise = res.body.recommendations.some(
        (r: { bookingType: string }) => r.bookingType === 'cruise'
      );
      expect(hasCruise).toBe(false);
      // Rules metadata should mention the exclusion
      expect(
        res.body.metadata.appliedRules.some((r: string) => r.includes('excluded_booking_types'))
      ).toBe(true);
    });

    it('respects partner recommendation cap', async () => {
      // mem_003 is in partner_valuemiles which caps at 3
      const res = await request(app)
        .post('/api/recommendations')
        .send({ memberId: 'mem_003' });

      expect(res.status).toBe(200);
      expect(res.body.recommendations.length).toBeLessThanOrEqual(3);
    });

    it('respects partner region restrictions', async () => {
      // mem_009 is in partner_coastalcu which only allows US Domestic
      const res = await request(app)
        .post('/api/recommendations')
        .send({ memberId: 'mem_009' });

      expect(res.status).toBe(200);
      for (const rec of res.body.recommendations) {
        expect(rec.region).toBe('US Domestic');
      }
    });

    it('returns structured recommendation objects', async () => {
      const res = await request(app)
        .post('/api/recommendations')
        .send({ memberId: 'mem_001' });

      expect(res.status).toBe(200);

      if (res.body.recommendations.length > 0) {
        const rec = res.body.recommendations[0];
        expect(rec.id).toBeTruthy();
        expect(rec.destination).toBeTruthy();
        expect(rec.region).toBeTruthy();
        expect(rec.bookingType).toBeTruthy();
        expect(rec.title).toBeTruthy();
        expect(rec.description).toBeTruthy();
        expect(rec.estimatedPrice).toBeDefined();
        expect(typeof rec.confidenceScore).toBe('number');
        expect(rec.confidenceScore).toBeGreaterThanOrEqual(0);
        expect(rec.confidenceScore).toBeLessThanOrEqual(1);
        expect(rec.reasoning).toBeTruthy();
      }
    });
  });
});
