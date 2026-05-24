/**
 * Universal chips shown when AI is unavailable or parsing fails.
 * Kept generic so they work in any conversation without misleading context.
 */

export const DEFAULT_SMART_REPLIES = Object.freeze([
  "Sounds good!",
  "Thanks!",
  "Got it!",
]);

export const getDefaultSuggestions = (maxItems = 3) =>
  DEFAULT_SMART_REPLIES.slice(0, Math.max(1, maxItems));
