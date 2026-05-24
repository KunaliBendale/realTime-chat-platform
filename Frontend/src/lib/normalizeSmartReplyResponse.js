import { getDefaultSmartReplies } from "./defaultSmartReplies";
import { normalizeSuggestionList } from "./suggestionValidation";

export const normalizeSmartReplyResponse = (payload) => {
  if (!payload || payload.success === false) {
    return {
      suggestions: getDefaultSmartReplies(),
      cached: false,
      reason: "default_fallback",
      meta: {
        shouldSuggest: true,
        source: "default",
        aiGenerated: false,
      },
    };
  }

  let suggestions = normalizeSuggestionList(payload.suggestions, 3, 120);

  if (!suggestions.length) {
    suggestions = getDefaultSmartReplies();
  }

  const shouldSuggest = suggestions.length > 0;

  return {
    suggestions,
    cached: Boolean(payload.cached),
    reason: payload.reason || "unknown",
    meta: {
      ...(payload.meta || {}),
      shouldSuggest,
      aiGenerated: payload.meta?.aiGenerated !== false && payload.reason === "generated",
    },
  };
};
