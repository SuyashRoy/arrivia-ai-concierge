import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';

/**
 * Attaches a unique requestId to every incoming request and logs
 * the request/response lifecycle with timing.
 *
 * Constraint 4 (On-Call Ownership): every request gets a requestId
 * that flows through the entire lifecycle so logs are searchable.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) ?? `req_${uuidv4().slice(0, 12)}`;
  const start = Date.now();

  // Attach requestId so downstream handlers can use it
  req.requestId = requestId;

  logger.info('Request received', {
    requestId,
    method: req.method,
    path: req.path,
    query: Object.keys(req.query).length > 0 ? req.query as Record<string, unknown> : undefined,
  });

  // Log when the response finishes
  res.on('finish', () => {
    logger.info('Response sent', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
    });
  });

  next();
}

// Extend the Express Request type to include requestId
declare global {
  namespace Express {
    interface Request {
      requestId: string;
    }
  }
}
