import { normalizeSuggestionList } from "./suggestionValidation.js";

export const sanitizeText = (value = "", maxLength = 2000) => {
  if (typeof value !== "string") return "";

  let cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ");
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  if (cleaned.length > maxLength) {
    cleaned = cleaned.slice(0, maxLength);
  }

  return cleaned;
};

export const sanitizePromptInput = (value = "", maxLength = 500) => {
  return sanitizeText(value, maxLength);
};

export const sanitizeSuggestions = (suggestions = [], maxItems = 3, maxLength = 120) => {
  return normalizeSuggestionList(suggestions, maxItems, maxLength);
};
