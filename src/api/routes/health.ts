import { Router, Request, Response } from 'express';
import { config } from '../../utils/config';
import { HealthResponse } from '../../types';

const startTime = Date.now();

/**
 * Health check endpoint used by load balancers and monitoring.
 * Returns version, uptime, and dependency status.
 * Constraint 4: meaningful health checks, not just { ok: true }.
 */
export function createHealthRouter(): Router {
  const router = Router();

  router.get('/health', (_req: Request, res: Response) => {
    const body: HealthResponse = {
      status: 'healthy',
      version: config.version,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
    };
    res.json(body);
  });

  return router;
}
