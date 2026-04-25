import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema, ZodError } from 'zod';
import { ErrorResponse } from '../../types';

/**
 * Creates an Express middleware that validates the request body against
 * a Zod schema. Returns a structured 400 error if validation fails.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        const body: ErrorResponse = {
          error: {
            code: 'VALIDATION_ERROR',
            message: messages.join('; '),
            timestamp: new Date().toISOString(),
            requestId: req.requestId ?? 'unknown',
          },
        };
        res.status(400).json(body);
        return;
      }
      next(err);
    }
  };
}

/** Zod schema for POST /api/recommendations request body. */
export const recommendationRequestSchema = z.object({
  memberId: z.string().min(1, 'memberId is required'),
  destinationPreference: z.string().optional(),
  bookingTypePreference: z.enum(['flight', 'hotel', 'rental_car', 'cruise', 'package']).optional(),
  budgetMax: z.number().positive().optional(),
  sessionId: z.string().optional(),
});
