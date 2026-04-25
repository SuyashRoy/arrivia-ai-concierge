import {
  IRuleEnforcer,
  Recommendation,
  PartnerConfig,
  LoyaltyTier,
  RuleEnforcementResult,
} from '../types';
import { logger } from '../utils/logger';

/**
 * Applies partner-specific rules to a list of raw recommendations.
 *
 * Constraint 2 (Partner Config Read-Only): This module NEVER overrides,
 * ignores, or works around partner rules. If partner config says no cruises,
 * there are ZERO cruises in the output. If all recommendations get filtered
 * out, we return an empty list with a clear explanation — we do NOT
 * "be helpful" by overriding the config.
 *
 * Constraint 4 (On-Call Ownership): Every rule application is logged at
 * INFO level so engineers can trace exactly what happened to a set of
 * recommendations during a 2am incident.
 */
export class RuleEnforcer implements IRuleEnforcer {
  /**
   * Filters and adjusts recommendations based on partner configuration.
   * Returns the filtered list AND metadata about which rules were enforced.
   */
  applyRules(
    recommendations: Recommendation[],
    partnerConfig: PartnerConfig,
    memberTier: LoyaltyTier
  ): RuleEnforcementResult {
    const appliedRules: string[] = [];
    const totalBefore = recommendations.length;
    let filtered = [...recommendations];

    // --- Rule: maxRecommendationsPerSession === 0 means no recs allowed ---
    if (partnerConfig.maxRecommendationsPerSession === 0) {
      appliedRules.push('max_recommendations_zero: partner allows 0 recommendations');
      logger.info('Partner allows zero recommendations', {
        partnerId: partnerConfig.partnerId,
        rule: 'max_recommendations_zero',
      });
      return { recommendations: [], appliedRules, totalBefore, totalAfter: 0 };
    }

    // --- Rule: Exclude booking types ---
    if (partnerConfig.excludedBookingTypes.length > 0) {
      const excluded = new Set(partnerConfig.excludedBookingTypes);
      const before = filtered.length;
      filtered = filtered.filter((rec) => !excluded.has(rec.bookingType));
      const removed = before - filtered.length;

      const ruleDesc = `excluded_booking_types: removed ${removed} recommendations of types [${partnerConfig.excludedBookingTypes.join(', ')}]`;
      appliedRules.push(ruleDesc);

      logger.info('Booking type exclusion applied', {
        partnerId: partnerConfig.partnerId,
        rule: 'excluded_booking_types',
        excludedTypes: partnerConfig.excludedBookingTypes,
        removedCount: removed,
        remainingCount: filtered.length,
      });
    }

    // --- Rule: Restrict to allowed regions ---
    if (partnerConfig.allowedRegions && partnerConfig.allowedRegions.length > 0) {
      const allowed = new Set(partnerConfig.allowedRegions);
      const before = filtered.length;
      filtered = filtered.filter((rec) => allowed.has(rec.region));
      const removed = before - filtered.length;

      const ruleDesc = `allowed_regions: removed ${removed} recommendations outside allowed regions [${partnerConfig.allowedRegions.join(', ')}]`;
      appliedRules.push(ruleDesc);

      logger.info('Region restriction applied', {
        partnerId: partnerConfig.partnerId,
        rule: 'allowed_regions',
        allowedRegions: partnerConfig.allowedRegions,
        removedCount: removed,
        remainingCount: filtered.length,
      });
    }

    // --- Rule: Apply tier-specific adjustments ---
    const tierBenefits = partnerConfig.tierBenefits[memberTier];
    if (tierBenefits) {
      if (tierBenefits.exclusiveDeals) {
        // Mark tier-exclusive recommendations for this tier
        filtered = filtered.map((rec) => ({
          ...rec,
          tierExclusive: rec.tierExclusive || tierBenefits.exclusiveDeals,
        }));
        appliedRules.push(`tier_exclusive_deals: ${memberTier} tier gets exclusive deal access`);
      }

      if (tierBenefits.discountPercentage > 0) {
        appliedRules.push(`tier_discount: ${memberTier} tier gets ${tierBenefits.discountPercentage}% discount`);
      }

      if (tierBenefits.priorityAccess) {
        appliedRules.push(`tier_priority_access: ${memberTier} tier has priority access`);
      }
    }

    // --- Rule: Cap recommendations ---
    if (partnerConfig.maxRecommendationsPerSession !== null && filtered.length > partnerConfig.maxRecommendationsPerSession) {
      const before = filtered.length;
      filtered = filtered.slice(0, partnerConfig.maxRecommendationsPerSession);

      const ruleDesc = `capped_at_${partnerConfig.maxRecommendationsPerSession}: trimmed from ${before} to ${partnerConfig.maxRecommendationsPerSession} recommendations`;
      appliedRules.push(ruleDesc);

      logger.info('Recommendation cap applied', {
        partnerId: partnerConfig.partnerId,
        rule: 'recommendation_cap',
        cap: partnerConfig.maxRecommendationsPerSession,
        beforeCap: before,
        afterCap: filtered.length,
      });
    }

    const totalAfter = filtered.length;

    logger.info('Partner rules applied', {
      partnerId: partnerConfig.partnerId,
      rulesApplied: appliedRules,
      recommendationsBefore: totalBefore,
      recommendationsAfter: totalAfter,
    });

    return { recommendations: filtered, appliedRules, totalBefore, totalAfter };
  }
}
