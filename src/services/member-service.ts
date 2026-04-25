import { IMemberService, Member, MemberNotFoundError, ServiceTimeoutError } from '../types';
import { MOCK_MEMBERS } from '../mocks/member-data';
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
 * Wraps a promise with a timeout. If the promise doesn't resolve within
 * the given duration, a ServiceTimeoutError is thrown.
 *
 * Constraint 4 (On-Call Ownership): a hung upstream must not hang our service.
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
 * Mock implementation of the member service.
 *
 * In production, this would make HTTP calls to the member service:
 *   const response = await fetch(`${MEMBER_SERVICE_URL}/members/${memberId}`);
 *   return response.json();
 */
export class MockMemberService implements IMemberService {
  private readonly timeoutMs: number;

  constructor(timeoutMs?: number) {
    this.timeoutMs = timeoutMs ?? config.serviceTimeoutMs;
  }

  /** Fetches a member by ID. Throws MemberNotFoundError if not found. */
  async getMember(memberId: string): Promise<Member> {
    const start = Date.now();

    try {
      const member = await withTimeout(
        this.fetchMember(memberId),
        this.timeoutMs,
        'MemberService'
      );

      logger.debug('Member fetched', {
        memberId,
        partnerId: member.partnerId,
        durationMs: Date.now() - start,
      });

      return member;
    } catch (error) {
      logger.error('Failed to fetch member', {
        memberId,
        durationMs: Date.now() - start,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async fetchMember(memberId: string): Promise<Member> {
    // In production, this would be:
    // const response = await fetch(`${config.memberServiceUrl}/members/${memberId}`);
    // if (response.status === 404) throw new MemberNotFoundError(memberId);
    // return response.json();

    await simulateLatency(20, 80);

    const member = MOCK_MEMBERS[memberId];
    if (!member) {
      throw new MemberNotFoundError(memberId);
    }
    return member;
  }
}
