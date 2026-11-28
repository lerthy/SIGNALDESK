import { rateLimit } from 'express-rate-limit';

export function createRateLimiter(limitPerMinute: number) {
  return rateLimit({
    windowMs: 60_000,
    limit: limitPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
    message: { data: null, error: { message: 'Too many requests, slow down.' } },
  });
}
