import { assertAiConfigured, aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";
import {
  buildMessageEnhancementPrompt,
  messageEnhancementResponseSchema,
  normalizeEnhancementTone,
} from "../prompts/messageEnhancement.prompt.js";
import { getAiProvider } from "../providers/providerFactory.js";
import { sanitizePromptInput, sanitizeText } from "../utils/sanitize.js";
import { withRetry, withTimeout } from "../utils/retry.js";
import { aiCache } from "./cache.service.js";
import { aiRateLimiter } from "./rateLimiter.service.js";
import { logAiUsage } from "./tokenLogger.service.js";

const hasMeaningfulText = (message) => /[\p{L}\p{N}]/u.test(message || "");

const parseEnhancedMessage = (providerResult) => {
  if (typeof providerResult?.json?.enhancedMessage === "string") {
    return providerResult.json.enhancedMessage;
  }

  try {
    const parsed = JSON.parse(providerResult?.text || "{}");

    if (typeof parsed?.enhancedMessage === "string") {
      return parsed.enhancedMessage;
    }
  } catch {
    return "";
  }

  return "";
};

const callProvider = async (provider, prompts) => {
  return withRetry(
    () =>
      withTimeout(
        provider.generateStructuredCompletion({
          ...prompts,
          schemaHint: {
            responseSchema: messageEnhancementResponseSchema,
          },
        }),
        aiConfig.smartReply.requestTimeoutMs,
        "AI request timed out",
      ),
    { maxRetries: aiConfig.smartReply.maxRetries },
  );
};

class MessageEnhancementService {
  validate({ message, tone }) {
    const cleanMessage = sanitizePromptInput(
      message,
      aiConfig.messageEnhancement.maxInputLength,
    );
    const normalizedTone = normalizeEnhancementTone(tone);

    if (!normalizedTone) {
      throw new AiError("Unsupported enhancement tone", {
        code: AiErrorCodes.VALIDATION,
        statusCode: 400,
      });
    }

    if (
      cleanMessage.length < aiConfig.messageEnhancement.minMeaningfulLength ||
      !hasMeaningfulText(cleanMessage)
    ) {
      throw new AiError("Message is too short to enhance", {
        code: AiErrorCodes.VALIDATION,
        statusCode: 400,
      });
    }

    return {
      message: cleanMessage,
      tone: normalizedTone,
    };
  }

  async enhance({ userId, message, tone }) {
    const payload = this.validate({ message, tone });
    const configStatus = assertAiConfigured();

    aiRateLimiter.consume(`message-enhancement:${userId}`);

    if (!configStatus.ok) {
      throw new AiError(configStatus.reason, {
        code: AiErrorCodes.NOT_CONFIGURED,
        statusCode: 503,
        retryable: true,
      });
    }

    const cacheKey = aiCache.buildKey([
      "message-enhancement-v1",
      userId?.toString(),
      aiConfig.provider,
      payload.tone,
      payload.message,
    ]);
    const cached = aiCache.get(cacheKey);

    if (cached) {
      await logAiUsage({
        userId,
        feature: "message_enhancement",
        provider: cached.provider,
        model: cached.model,
        usage: cached.usage,
        cached: true,
        success: true,
      });

      return {
        enhancedMessage: cached.enhancedMessage,
        tone: payload.tone,
        cached: true,
      };
    }

    const provider = getAiProvider();
    const prompts = buildMessageEnhancementPrompt(payload);
    const startedAt = Date.now();
    let usage = {};
    let providerName = provider.name;
    let modelName = aiConfig.gemini.model || "unknown";

    try {
      const result = await callProvider(provider, prompts);
      const enhancedMessage = sanitizeText(
        parseEnhancedMessage(result),
        aiConfig.messageEnhancement.maxOutputLength,
      );

      usage = result.usage || {};
      providerName = usage.provider || provider.name;
      modelName = usage.model || modelName;

      if (!enhancedMessage || !hasMeaningfulText(enhancedMessage)) {
        throw new AiError("AI returned an invalid enhancement", {
          code: AiErrorCodes.PARSE,
          statusCode: 502,
          retryable: true,
        });
      }

      const latencyMs = Date.now() - startedAt;

      aiCache.set(
        cacheKey,
        {
          enhancedMessage,
          provider: providerName,
          model: modelName,
          usage,
        },
        aiConfig.messageEnhancement.cacheTtlMs,
      );

      await logAiUsage({
        userId,
        feature: "message_enhancement",
        provider: providerName,
        model: modelName,
        usage,
        latencyMs,
        success: true,
      });

      return {
        enhancedMessage,
        tone: payload.tone,
        cached: false,
        meta: {
          provider: providerName,
          latencyMs,
        },
      };
    } catch (error) {
      await logAiUsage({
        userId,
        feature: "message_enhancement",
        provider: providerName,
        model: modelName,
        usage,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorCode: error.code || AiErrorCodes.PROVIDER,
      });

      throw error;
    }
  }
}

export const messageEnhancementService = new MessageEnhancementService();
