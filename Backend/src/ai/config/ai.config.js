import dotenv from "dotenv";

dotenv.config();

const parseIntEnv = (key, fallback) => {
  const value = Number.parseInt(process.env[key], 10);
  return Number.isFinite(value) ? value : fallback;
};

const parseListEnv = (key, fallback = []) => {
  const values = (process.env[key] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  return values.length ? values : fallback;
};

export const aiConfig = {
  enabled: process.env.AI_ENABLED !== "false",

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    fallbackModels: parseListEnv("GEMINI_FALLBACK_MODELS", [
      "gemini-2.0-flash",
    ]),
    baseUrl:
      process.env.GEMINI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta",
  },

  smartReply: {
    maxHistoryMessages: parseIntEnv("AI_SMART_REPLY_MAX_MESSAGES", 12),
    maxSuggestions: parseIntEnv("AI_SMART_REPLY_MAX_SUGGESTIONS", 3),
    maxSuggestionLength: parseIntEnv("AI_SMART_REPLY_MAX_LENGTH", 120),
    requestTimeoutMs: parseIntEnv("AI_REQUEST_TIMEOUT_MS", 12000),
    cacheTtlMs: parseIntEnv("AI_CACHE_TTL_MS", 5 * 60 * 1000),
    debounceMs: parseIntEnv("AI_DEBOUNCE_MS", 800),
    maxRetries: parseIntEnv("AI_MAX_RETRIES", 2),
  },

  messageEnhancement: {
    maxInputLength: parseIntEnv("AI_ENHANCE_MAX_INPUT_LENGTH", 800),
    maxOutputLength: parseIntEnv("AI_ENHANCE_MAX_OUTPUT_LENGTH", 1600),
    maxOutputTokens: parseIntEnv("AI_ENHANCE_MAX_OUTPUT_TOKENS", 1024),
    minMeaningfulLength: parseIntEnv("AI_ENHANCE_MIN_LENGTH", 4),
    cacheTtlMs: parseIntEnv("AI_ENHANCE_CACHE_TTL_MS", 2 * 60 * 1000),
    requestTimeoutMs: parseIntEnv("AI_ENHANCE_REQUEST_TIMEOUT_MS", 18000),
  },

  rateLimit: {
    windowMs: parseIntEnv("AI_RATE_LIMIT_WINDOW_MS", 60 * 1000),
    maxRequests: parseIntEnv("AI_RATE_LIMIT_MAX_REQUESTS", 15),
  },
};

export const assertAiConfigured = () => {
  if (!aiConfig.enabled) {
    return { ok: false, reason: "AI features are disabled" };
  }

  if (!aiConfig.gemini.apiKey) {
    return { ok: false, reason: "GEMINI_API_KEY is not configured" };
  }

  return { ok: true };
};
