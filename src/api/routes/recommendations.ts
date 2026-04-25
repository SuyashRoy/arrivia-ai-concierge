import { Router, Request, Response, NextFunction } from 'express';
import {
  IMemberService,
  IPartnerConfigService,
  IRecommendationEngine,
  IRuleEnforcer,
  RecommendationRequest,
  RecommendationResponse,
} from '../../types';
import { validateBody, recommendationRequestSchema } from '../middleware/validate';
import { logger } from '../../utils/logger';

interface RecommendationsDeps {
  memberService: IMemberService;
  partnerConfigService: IPartnerConfigService;
  recommendationEngine: IRecommendationEngine;
  ruleEnforcer: IRuleEnforcer;
}

/**
 * POST /api/recommendations
 *
 * Full flow: fetch member -> fetch partner config -> generate
 * recommendations -> apply rules -> return response.
 */
export function createRecommendationsRouter(deps: RecommendationsDeps): Router {
  const router = Router();
  const { memberService, partnerConfigService, recommendationEngine, ruleEnforcer } = deps;

  router.post(
    '/api/recommendations',
    validateBody(recommendationRequestSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      const requestId = req.requestId;
      const start = Date.now();

      try {
        const body = req.body as RecommendationRequest;

        // Step 1: Fetch member
        const member = await memberService.getMember(body.memberId);

        logger.info('Processing recommendation request', {
          requestId,
          memberId: member.memberId,
          partnerId: member.partnerId,
          loyaltyTier: member.loyaltyTier,
        });

        // Step 2: Fetch partner config (READ-ONLY — Constraint 2)
        const partnerConfig = await partnerConfigService.getPartnerConfig(member.partnerId);

        // Step 3: Generate raw recommendations
        const rawRecommendations = await recommendationEngine.generateRecommendations(member, body);

        // Step 4: Apply partner rules
        const result = ruleEnforcer.applyRules(rawRecommendations, partnerConfig, member.loyaltyTier);

        const response: RecommendationResponse = {
          memberId: member.memberId,
          partnerId: partnerConfig.partnerId,
          partnerName: partnerConfig.partnerName,
          loyaltyTier: member.loyaltyTier,
          recommendations: result.recommendations,
          metadata: {
            totalGenerated: result.totalBefore,
            totalAfterFiltering: result.totalAfter,
            appliedRules: result.appliedRules,
            generatedAt: new Date().toISOString(),
          },
        };

        logger.info('Recommendation request completed', {
          requestId,
          memberId: member.memberId,
          partnerId: partnerConfig.partnerId,
          totalGenerated: result.totalBefore,
          totalAfterFiltering: result.totalAfter,
          rulesApplied: result.appliedRules,
          durationMs: Date.now() - start,
        });

        res.json(response);
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
