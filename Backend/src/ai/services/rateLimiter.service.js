import { aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";

class RateLimiterService {
  constructor() {
    this.buckets = new Map();
  }

  consume(key, { windowMs = aiConfig.rateLimit.windowMs, maxRequests = aiConfig.rateLimit.maxRequests } = {}) {
    const now = Date.now();
    const bucket = this.buckets.get(key) || { count: 0, resetAt: now + windowMs };

    if (now > bucket.resetAt) {
      bucket.count = 0;
      bucket.resetAt = now + windowMs;
    }

    bucket.count += 1;
    this.buckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      throw new AiError("AI rate limit exceeded. Please wait a moment.", {
        code: AiErrorCodes.RATE_LIMITED,
        statusCode: 429,
        retryable: true,
      });
    }

    return {
      remaining: Math.max(0, maxRequests - bucket.count),
      resetAt: bucket.resetAt,
    };
  }
}

export const aiRateLimiter = new RateLimiterService();
