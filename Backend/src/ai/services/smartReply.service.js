import mongoose from "mongoose";
import Chat from "../../models/chatModel.js";
import Message from "../../models/messageModel.js";
import { assertAiConfigured, aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";
import {
  buildSmartReplyPrompt,
  buildSmartReplyRetryPrompt,
  smartReplyResponseSchema,
} from "../prompts/smartReply.prompt.js";
import { aiDebug } from "../utils/aiDebug.js";
import { getDefaultSuggestions } from "../utils/defaultSuggestions.js";
import { buildFallbackSmartReplies } from "../utils/localFallbacks.js";
import { resolveSmartReplySuggestions } from "../utils/parseSmartReplySuggestions.js";
import { sanitizePromptInput } from "../utils/sanitize.js";
import { aiCache } from "./cache.service.js";
import { geminiService } from "./gemini.service.js";
import { aiRateLimiter } from "./rateLimiter.service.js";
import { logAiUsage } from "./tokenLogger.service.js";

const mapMessageForAi = (message, currentUserId) => {
  const senderId = message.sender?._id?.toString() || message.sender?.toString();
  const senderName = message.sender?.name || "User";
  const content = sanitizePromptInput(message.message || message.image || "", 500);

  return {
    id: message._id?.toString(),
    senderName: sanitizePromptInput(senderName, 80),
    content,
    isOwn: senderId === currentUserId?.toString(),
    createdAt: message.createdAt,
  };
};

const generateSmartReplies = (prompts) =>
  geminiService.generateJson({
    ...prompts,
    responseSchema: smartReplyResponseSchema,
    maxOutputTokens: 768,
  });

const buildDefaultReplyResult = ({ lastMessage, reason, cached = false }) => ({
  suggestions: lastMessage?.content
    ? buildFallbackSmartReplies(lastMessage.content, aiConfig.smartReply.maxSuggestions)
    : getDefaultSuggestions(aiConfig.smartReply.maxSuggestions),
  cached,
  reason,
  meta: {
    shouldSuggest: true,
    lastMessageId: lastMessage?.id,
    source: lastMessage?.content ? "local_fallback" : "default",
    aiGenerated: false,
  },
});

export class SmartReplyService {
  async getSuggestionsForChat({ userId, chatId, forceRefresh = false }) {
    const configStatus = assertAiConfigured();

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      throw new AiError("Invalid chatId", {
        code: AiErrorCodes.VALIDATION,
        statusCode: 400,
      });
    }

    aiRateLimiter.consume(`smart-reply:${userId}`);

    const chat = await Chat.findOne({ _id: chatId, users: userId }).populate(
      "users",
      "name",
    );

    if (!chat) {
      throw new AiError("Chat not found", {
        code: AiErrorCodes.VALIDATION,
        statusCode: 404,
      });
    }

    const rawMessages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .limit(aiConfig.smartReply.maxHistoryMessages)
      .populate("sender", "name")
      .lean();

    const messages = rawMessages.reverse().map((msg) => mapMessageForAi(msg, userId));

    const lastMessage = messages[messages.length - 1];

    if (!lastMessage?.content) {
      return {
        suggestions: [],
        cached: false,
        reason: "empty_chat",
        meta: { shouldSuggest: false },
      };
    }

    if (lastMessage.isOwn) {
      return {
        suggestions: [],
        cached: false,
        reason: "awaiting_incoming",
        meta: { shouldSuggest: false, lastMessageId: lastMessage.id },
      };
    }

    if (!configStatus.ok) {
      aiDebug("AI not configured, using default suggestions", configStatus.reason);
      return buildDefaultReplyResult({ lastMessage, reason: "default_fallback" });
    }

    const cacheKey = aiCache.buildKey([
      "smart-reply-v7",
      chatId,
      lastMessage.id,
      aiConfig.gemini.model,
    ]);

    if (!forceRefresh) {
      const cached = aiCache.get(cacheKey);

      if (cached) {
        await logAiUsage({
          userId,
          chatId,
          provider: cached.provider,
          model: cached.model,
          usage: cached.usage,
          cached: true,
          success: true,
        });

        const cachedResolved = resolveSmartReplySuggestions(
          { suggestions: cached.suggestions },
          aiConfig.smartReply.maxSuggestions,
          aiConfig.smartReply.maxSuggestionLength,
        );

        if (!cachedResolved.suggestions.length) {
          aiCache.delete(cacheKey);
        } else {
          return {
            suggestions: cachedResolved.suggestions,
            cached: true,
            reason: "cache_hit",
            meta: {
              shouldSuggest: true,
              lastMessageId: lastMessage.id,
              provider: cached.provider,
              source: "cache",
              aiGenerated: true,
            },
          };
        }
      }
    }

    const currentUser = chat.users.find(
      (participant) => participant._id.toString() === userId.toString(),
    );

    const otherParticipant = chat.users.find(
      (participant) => participant._id.toString() !== userId.toString(),
    );

    const chatName = chat.isGroup
      ? chat.chatName
      : otherParticipant?.name || "Contact";

    const currentUserName = currentUser?.name || "You";
    const mainPrompts = buildSmartReplyPrompt({
      currentUserName,
      chatName,
      isGroup: chat.isGroup,
      messages,
      lastIncomingMessage: lastMessage,
    });

    const startedAt = Date.now();

    let suggestions = [];
    let usage = {};
    let providerName = geminiService.provider;
    let modelName = aiConfig.gemini.model || "unknown";
    let generationReason = "generated";
    let parseSource = "unknown";

    try {
      let result = await generateSmartReplies(mainPrompts);

      usage = result.usage;
      providerName = result.usage.provider;
      modelName = result.usage.model;

      aiDebug("raw provider text (attempt 1)", result.text?.slice(0, 500));

      let resolved = resolveSmartReplySuggestions(
        result,
        aiConfig.smartReply.maxSuggestions,
        aiConfig.smartReply.maxSuggestionLength,
      );

      if (!resolved.suggestions.length) {
        aiDebug("parse failed on attempt 1, retrying with focused prompt", {
          textPreview: result.text?.slice(0, 300),
        });

        const retryPrompts = buildSmartReplyRetryPrompt({
          currentUserName,
          lastIncomingMessage: lastMessage,
        });

        result = await generateSmartReplies(retryPrompts);
        usage = result.usage;

        aiDebug("raw provider text (attempt 2)", result.text?.slice(0, 500));

        resolved = resolveSmartReplySuggestions(
          result,
          aiConfig.smartReply.maxSuggestions,
          aiConfig.smartReply.maxSuggestionLength,
        );
      }

      suggestions = resolved.suggestions;
      parseSource = resolved.source;

      aiDebug("resolved suggestions", { source: parseSource, suggestions });

      if (!suggestions.length) {
        aiDebug("could not parse AI response after 2 attempts, using defaults", {
          textPreview: result.text?.slice(0, 400),
        });
        return buildDefaultReplyResult({ lastMessage, reason: "default_fallback" });
      }
    } catch (error) {
      await logAiUsage({
        userId,
        chatId,
        provider: providerName,
        model: modelName,
        usage,
        latencyMs: Date.now() - startedAt,
        success: false,
        errorCode: error.code || AiErrorCodes.GEMINI,
      });

      aiDebug("AI provider error, using default suggestions", {
        message: error.message,
        code: error.code,
      });

      return buildDefaultReplyResult({ lastMessage, reason: "default_fallback" });
    }

    const latencyMs = Date.now() - startedAt;

    aiCache.set(cacheKey, {
      suggestions,
      provider: providerName,
      model: modelName,
      usage,
    });

    await logAiUsage({
      userId,
      chatId,
      provider: providerName,
      model: modelName,
      usage,
      latencyMs,
      cached: false,
      success: true,
    });

    return {
      suggestions,
      cached: false,
      reason: generationReason,
      meta: {
        shouldSuggest: true,
        lastMessageId: lastMessage.id,
        provider: providerName,
        latencyMs,
        source: parseSource,
        aiGenerated: true,
      },
    };
  }
}

export const smartReplyService = new SmartReplyService();
