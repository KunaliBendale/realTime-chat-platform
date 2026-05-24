/** Mirror of Backend/src/ai/utils/defaultSuggestions.js */

export const DEFAULT_SMART_REPLIES = Object.freeze([
  "Sounds good!",
  "Thanks!",
  "Got it!",
]);

export const getDefaultSmartReplies = (maxItems = 3) =>
  DEFAULT_SMART_REPLIES.slice(0, Math.max(1, maxItems));
