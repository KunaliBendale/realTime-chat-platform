import { getDefaultSuggestions } from "../utils/defaultSuggestions.js";
import { sanitizeSuggestions } from "../utils/sanitize.js";
import { smartReplyService } from "../services/smartReply.service.js";

/**
 * Request/response pattern only — no broadcasts (avoids socket spam).
 */
export const registerSmartReplySocketHandlers = (io, socket) => {
  socket.on("smartReplies:request", async (payload = {}, callback) => {
    if (typeof callback !== "function") return;

    const { chatId, forceRefresh = false } = payload;

    if (!chatId) {
      return callback({
        success: false,
        code: "AI_VALIDATION",
        message: "chatId is required",
        suggestions: getDefaultSuggestions(),
      });
    }

    try {
      const result = await smartReplyService.getSuggestionsForChat({
        userId: socket.user.userId,
        chatId,
        forceRefresh: Boolean(forceRefresh),
      });

      let suggestions = sanitizeSuggestions(result.suggestions || []);

      if (!suggestions.length && result.meta?.shouldSuggest !== false) {
        suggestions = getDefaultSuggestions();
      }

      callback({
        success: true,
        suggestions,
        cached: Boolean(result.cached),
        reason: result.reason,
        meta: {
          ...result.meta,
          shouldSuggest: suggestions.length > 0,
        },
      });
    } catch {
      const suggestions = getDefaultSuggestions();

      callback({
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
  });
};
