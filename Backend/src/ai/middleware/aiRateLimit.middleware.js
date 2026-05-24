import { aiRateLimiter } from "../services/rateLimiter.service.js";
import { AiError } from "../errors/AiError.js";
import { toAiErrorResponse } from "../errors/AiError.js";

export const aiRequestRateLimit = (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const remaining = aiRateLimiter.consume(`ai-http:${req.user._id}`);
    res.setHeader("X-AI-RateLimit-Remaining", String(remaining.remaining));
    res.setHeader("X-AI-RateLimit-Reset", String(remaining.resetAt));

    return next();
  } catch (error) {
    const payload = toAiErrorResponse(error);
    const statusCode = error instanceof AiError ? error.statusCode : 429;
    return res.status(statusCode).json(payload);
  }
};
