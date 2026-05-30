import { assertAiConfigured } from "../config/ai.config.js";
import { AiError, toAiErrorResponse } from "../errors/AiError.js";
import { smartReplyService } from "../services/smartReply.service.js";
import { messageEnhancementService } from "../services/messageEnhancement.service.js";
import { getDefaultSuggestions } from "../utils/defaultSuggestions.js";
import { sanitizeSuggestions } from "../utils/sanitize.js";

export const getSmartReplySuggestions = async (req, res) => {
  try {
    const { chatId } = req.params;
    const forceRefresh = req.query.refresh === "true";

    const result = await smartReplyService.getSuggestionsForChat({
      userId: req.user._id,
      chatId,
      forceRefresh,
    });

    let suggestions = sanitizeSuggestions(result.suggestions || []);

    if (!suggestions.length && result.meta?.shouldSuggest !== false) {
      suggestions = getDefaultSuggestions();
    }

    return res.status(200).json({
      success: true,
      suggestions,
      cached: Boolean(result.cached),
      reason: result.reason,
      meta: {
        ...result.meta,
        shouldSuggest: suggestions.length > 0,
      },
    });
  } catch (error) {
    if (error instanceof AiError && error.statusCode === 400) {
      const payload = toAiErrorResponse(error);
      return res.status(error.statusCode).json(payload);
    }

    const suggestions = getDefaultSuggestions();

    return res.status(200).json({
      success: true,
      suggestions,
      cached: false,
      reason: "default_fallback",
      meta: {
        shouldSuggest: true,
        source: "default",
        aiGenerated: false,
      },
    });
  }
};

export const getAiStatus = async (_req, res) => {
  const status = assertAiConfigured();

  return res.status(200).json({
    success: true,
    enabled: status.ok,
    message: status.ok ? "AI is configured" : status.reason,
    provider: process.env.AI_PROVIDER || "gemini",
    model: process.env.GEMINI_MODEL || "gemini-2.0-flash",
  });
};

export const enhanceMessage = async (req, res) => {
  try {
    const result = await messageEnhancementService.enhance({
      userId: req.user._id,
      message: req.body.message,
      tone: req.body.tone,
    });

    return res.status(200).json({
      success: true,
      enhancedMessage: result.enhancedMessage,
      tone: result.tone,
      cached: Boolean(result.cached),
      meta: result.meta,
    });
  } catch (error) {
    const statusCode = error instanceof AiError ? error.statusCode : 503;
    const payload = toAiErrorResponse(error);

    return res.status(statusCode || 503).json({
      ...payload,
      message:
        payload.code === "AI_VALIDATION"
          ? payload.message
          : "Unable to enhance message right now",
    });
  }
};
