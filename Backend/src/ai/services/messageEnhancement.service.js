import { assertAiConfigured, aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";
import {
  buildMessageEnhancementPrompt,
  messageEnhancementResponseSchema,
  normalizeEnhancementTone,
} from "../prompts/messageEnhancement.prompt.js";
import { buildFallbackEnhancement } from "../utils/localFallbacks.js";
import { sanitizePromptInput, sanitizeText } from "../utils/sanitize.js";
import { aiCache } from "./cache.service.js";
import { geminiService } from "./gemini.service.js";
import { aiRateLimiter } from "./rateLimiter.service.js";
import { logAiUsage } from "./tokenLogger.service.js";

const hasMeaningfulText = (message) => /[\p{L}\p{N}]/u.test(message || "");

const shouldUseFallbackEnhancement = (error) =>
  [
    AiErrorCodes.GEMINI,
    AiErrorCodes.PARSE,
    AiErrorCodes.TIMEOUT,
    AiErrorCodes.NOT_CONFIGURED,
  ].includes(error?.code);

const parseEnhancedMessage = (providerResult) => {
  if (typeof providerResult?.json?.enhancedMessage === "string") {
    return providerResult.json.enhancedMessage;
  }

  const text = providerResult?.text || "";

  const tryParse = (candidate) => {
    try {
      const parsed = JSON.parse(candidate);
      return typeof parsed?.enhancedMessage === "string"
        ? parsed.enhancedMessage
        : "";
    } catch {
      return "";
    }
  };

  const direct = tryParse(text);
  if (direct) return direct;

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const fromObject = tryParse(objectMatch[0]);
    if (fromObject) return fromObject;
  }

  const propertyMatch = text.match(/"enhancedMessage"\s*:\s*"((?:\\.|[^"\\])*)"?/i);
  if (propertyMatch?.[1]) {
    try {
      return JSON.parse(`"${propertyMatch[1]}"`);
    } catch {
      return propertyMatch[1].replace(/\\"/g, '"');
    }
  }

  return "";
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
      const enhancedMessage = sanitizeText(
        buildFallbackEnhancement(payload),
        aiConfig.messageEnhancement.maxOutputLength,
      );

      await logAiUsage({
        userId,
        feature: "message_enhancement",
        provider: geminiService.provider,
        model: aiConfig.gemini.model || "unknown",
        success: false,
        errorCode: AiErrorCodes.NOT_CONFIGURED,
      });

      return {
        enhancedMessage,
        tone: payload.tone,
        cached: false,
        meta: {
          provider: geminiService.provider,
          model: aiConfig.gemini.model || "unknown",
          source: "local_fallback",
          aiGenerated: false,
        },
      };
    }

    const cacheKey = aiCache.buildKey([
      "message-enhancement-v1",
      userId?.toString(),
      aiConfig.gemini.model,
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

    const prompts = buildMessageEnhancementPrompt(payload);
    const startedAt = Date.now();
    let usage = {};
    let providerName = geminiService.provider;
    let modelName = aiConfig.gemini.model || "unknown";

    try {
      const result = await geminiService.generateJson({
        ...prompts,
        responseSchema: messageEnhancementResponseSchema,
        maxOutputTokens: 512,
      });
      const enhancedMessage = sanitizeText(
        parseEnhancedMessage(result),
        aiConfig.messageEnhancement.maxOutputLength,
      );

      usage = result.usage || {};
      providerName = usage.provider || geminiService.provider;
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
        errorCode: error.code || AiErrorCodes.GEMINI,
      });

      if (shouldUseFallbackEnhancement(error)) {
        const enhancedMessage = sanitizeText(
          buildFallbackEnhancement(payload),
          aiConfig.messageEnhancement.maxOutputLength,
        );

        return {
          enhancedMessage,
          tone: payload.tone,
          cached: false,
          meta: {
            provider: providerName,
            model: modelName,
            source: "local_fallback",
            aiGenerated: false,
          },
        };
      }

      throw error;
    }
  }
}

export const messageEnhancementService = new MessageEnhancementService();
