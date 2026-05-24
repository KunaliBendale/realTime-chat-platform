import dotenv from "dotenv";

dotenv.config();

const parseIntEnv = (key, fallback) => {
  const value = Number.parseInt(process.env[key], 10);
  return Number.isFinite(value) ? value : fallback;
};

export const aiConfig = {
  enabled: process.env.AI_ENABLED !== "false",
  provider: (process.env.AI_PROVIDER || "gemini").toLowerCase(),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    // See https://ai.google.dev/gemini-api/docs/quickstart (e.g. gemini-2.0-flash, gemini-3.5-flash)
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
    baseUrl:
      process.env.GEMINI_BASE_URL ||
      "https://generativelanguage.googleapis.com/v1beta",
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
  },

  claude: {
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: process.env.CLAUDE_MODEL || "claude-3-5-haiku-20241022",
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

  rateLimit: {
    windowMs: parseIntEnv("AI_RATE_LIMIT_WINDOW_MS", 60 * 1000),
    maxRequests: parseIntEnv("AI_RATE_LIMIT_MAX_REQUESTS", 15),
  },
};

export const assertAiConfigured = () => {
  if (!aiConfig.enabled) {
    return { ok: false, reason: "AI features are disabled" };
  }

  const provider = aiConfig.provider;

  if (provider === "gemini" && !aiConfig.gemini.apiKey) {
    return { ok: false, reason: "GEMINI_API_KEY is not configured" };
  }

  if (provider === "openai" && !aiConfig.openai.apiKey) {
    return { ok: false, reason: "OPENAI_API_KEY is not configured" };
  }

  if (provider === "claude" && !aiConfig.claude.apiKey) {
    return { ok: false, reason: "ANTHROPIC_API_KEY is not configured" };
  }

  return { ok: true };
};
