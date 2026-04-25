import express from 'express';
import { config } from './utils/config';
import { logger } from './utils/logger';
import { requestLogger } from './api/middleware/request-logger';
import { errorHandler } from './api/middleware/error-handler';
import { createHealthRouter } from './api/routes/health';
import { createMembersRouter } from './api/routes/members';
import { createRecommendationsRouter } from './api/routes/recommendations';
import { MockMemberService } from './services/member-service';
import { MockPartnerConfigService } from './services/partner-config-service';
import { RecommendationEngine } from './services/recommendation-engine';
import { RuleEnforcer } from './services/rule-enforcer';

/**
 * Creates and configures the Express application.
 * Exported separately so integration tests can import the app without
 * starting the HTTP listener.
 */
export function createApp() {
  const app = express();

  // --- Dependency injection (services) ---
  const memberService = new MockMemberService();
  const partnerConfigService = new MockPartnerConfigService();
  const recommendationEngine = new RecommendationEngine();
  const ruleEnforcer = new RuleEnforcer();

  // --- Middleware ---
  app.use(express.json());
  app.use(requestLogger);

  // --- Routes ---
  app.use(createHealthRouter());
  app.use(createMembersRouter(memberService));
  app.use(
    createRecommendationsRouter({
      memberService,
      partnerConfigService,
      recommendationEngine,
      ruleEnforcer,
    })
  );

  // --- Global error handler (must be registered last) ---
  app.use(errorHandler);

  return app;
}

// Start the server only when this file is executed directly (not imported)
if (require.main === module) {
  const app = createApp();
  app.listen(config.port, () => {
    logger.info('Server started', {
      port: config.port,
      nodeEnv: config.nodeEnv,
      version: config.version,
    });
  });
}
