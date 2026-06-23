// services/api-gateway/src/middleware/rateLimiter.ts
// #rate-limiting #redis-backed #sliding-window

import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { config } from '../config';

const redis = new Redis(config.redis.url, {
  retryStrategy: (times) => Math.min(times * 50, 2000),
  maxRetriesPerRequest: 3,
});

export const rateLimiter = (options?: { windowMs?: number; maxRequests?: number }) => {
  const windowMs = options?.windowMs || config.rateLimit.windowMs;
  const maxRequests = options?.maxRequests || config.rateLimit.maxRequests;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // #rate-limit-key
      const clientKey = (req as any).user?.userId || req.ip;
      const key = `ratelimit:${clientKey}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // #redis-pipeline-atomic
      const pipeline = redis.pipeline();
      pipeline.zremrangebyscore(key, 0, windowStart);
      pipeline.zadd(key, now, `${now}-${Math.random().toString(36).substr(2, 8)}`);
      pipeline.zcard(key);
      pipeline.expire(key, Math.ceil(windowMs / 1000));

      const results = await pipeline.exec();
      
      if (!results) {
        return next(); // #fail-open
      }

      const requestCount = results[2][1] as number;

      // #rate-limit-headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - requestCount));
      res.setHeader('X-RateLimit-Reset', Math.ceil((windowStart + windowMs) / 1000));

      if (requestCount > maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil(windowMs / 1000)
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      next(); // #fail-open-redis-down
    }
  };
};
