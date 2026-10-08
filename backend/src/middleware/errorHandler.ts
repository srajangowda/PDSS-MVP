import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[PediPulse Error]', err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Invalid request data.',
      details: err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Sanitize internal server errors, never expose stack traces to client
  res.status(500).json({
    error: 'A system error occurred while processing your request. Please try again.',
  });
}

