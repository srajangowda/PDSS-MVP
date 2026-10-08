import { Request, Response, NextFunction } from 'express';

// Simple sliding window rate limiter for cost control on AI endpoints
const requestLog = new Map<string, number[]>();

export function rateLimitAI(maxRequests = 10, windowMs = 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = (req.headers['x-forwarded-for'] as string) || req.ip || 'global';
    const now = Date.now();
    const timestamps = requestLog.get(key) || [];
    const valid = timestamps.filter((t) => now - t < windowMs);

    if (valid.length >= maxRequests) {
      res.status(429).json({
        error: 'Too many AI explanation requests. Please wait a minute before trying again.',
      });
      return;
    }

    valid.push(now);
    requestLog.set(key, valid);
    next();
  };
}

