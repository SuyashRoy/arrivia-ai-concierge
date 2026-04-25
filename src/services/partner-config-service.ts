import { IPartnerConfigService, PartnerConfig, PartnerConfigNotFoundError, ServiceTimeoutError } from '../types';
import { MOCK_PARTNER_CONFIGS } from '../mocks/partner-config-data';
import { logger } from '../utils/logger';
import { config } from '../utils/config';

/**
 * Simulates network latency to establish the async pattern used in production.
 */
function simulateLatency(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

/**
 * Wraps a promise with a timeout.
 * Constraint 4: a hung upstream call must not hang our service.
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, serviceName: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new ServiceTimeoutError(serviceName));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/**
 * Mock implementation of the partner configuration service.
 *
 * IMPORTANT — Constraint 2 (Partner Config Read-Only):
 * This service is READ-ONLY. We can ONLY call getPartnerConfig().
 * We cannot modify, update, or write partner rules. Partner config is
 * owned by another team's service. If config seems wrong, we enforce it
 * as-is and log a warning — we never override it.
 *
 * In production, this would make HTTP calls to the partner config service:
 *   const response = await fetch(`${PARTNER_CONFIG_URL}/partners/${partnerId}`);
 *   return response.json();
 *
 * Future work (out of scope for 4-week MVP): add a short-TTL Redis/ElastiCache
 * layer so we don't hit the partner config service on every single request.
 */
export class MockPartnerConfigService implements IPartnerConfigService {
  private readonly timeoutMs: number;

  constructor(timeoutMs?: number) {
    this.timeoutMs = timeoutMs ?? config.serviceTimeoutMs;
  }

  /** Fetches partner configuration by ID. READ-ONLY — no write methods exist. */
  async getPartnerConfig(partnerId: string): Promise<PartnerConfig> {
    const start = Date.now();

    try {
      const partnerConfig = await withTimeout(
        this.fetchPartnerConfig(partnerId),
        this.timeoutMs,
        'PartnerConfigService'
      );

      logger.debug('Partner config fetched', {
        partnerId,
        durationMs: Date.now() - start,
      });

      return partnerConfig;
    } catch (error) {
      logger.error('Failed to fetch partner config', {
        partnerId,
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async fetchPartnerConfig(partnerId: string): Promise<PartnerConfig> {
    // In production, this would be:
    // const response = await fetch(`${config.partnerConfigUrl}/partners/${partnerId}`);
    // if (response.status === 404) throw new PartnerConfigNotFoundError(partnerId);
    // return response.json();

    await simulateLatency(10, 50);

    const partnerConfig = MOCK_PARTNER_CONFIGS[partnerId];
    if (!partnerConfig) {
      throw new PartnerConfigNotFoundError(partnerId);
    }
    return partnerConfig;
  }
}
