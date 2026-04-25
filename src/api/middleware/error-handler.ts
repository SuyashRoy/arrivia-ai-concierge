import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorResponse } from '../../types';
import { logger } from '../../utils/logger';

/**
 * Global error-handling middleware.
 *
 * Constraint 4 (On-Call Ownership):
 * - Never leaks stack traces to clients.
 * - Always returns structured JSON with code, message, timestamp, requestId.
 * - Logs the full error with stack trace server-side for debugging.
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.requestId ?? 'unknown';

  if (err instanceof AppError) {
    // Known application errors — log at warn/error depending on status
    const logLevel = err.statusCode >= 500 ? 'error' : 'warn';
    logger[logLevel](err.message, {
      requestId,
      code: err.code,
      statusCode: err.statusCode,
      stack: err.stack,
    });

    const body: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        timestamp: new Date().toISOString(),
        requestId,
      },
    };

    res.status(err.statusCode).json(body);
    return;
  }

  // Unexpected errors — log full details, return generic message
  logger.error('Unhandled error', {
    requestId,
    error: err.message,
    stack: err.stack,
  });

  const body: ErrorResponse = {
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
      requestId,
    },
  };

  res.status(500).json(body);
}
