/**
 * Extract suggestions ONLY from structured JSON in LLM output.
 * Never falls back to line-splitting (avoids preamble like "Here is the JSON requested:").
 */

import { normalizeSuggestionList } from "./suggestionValidation.js";

const SUGGESTION_KEYS = ["suggestions", "replies", "reply", "responses", "options"];

const tryParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const collectFromParsed = (parsed, depth = 0) => {
  if (depth > 5 || parsed == null) return [];

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (typeof parsed === "object") {
    for (const key of SUGGESTION_KEYS) {
      if (Array.isArray(parsed[key])) {
        return parsed[key];
      }
    }
  }

  if (typeof parsed === "string") {
    const inner = tryParseJson(parsed.trim());
    if (inner) return collectFromParsed(inner, depth + 1);
    return [];
  }

  return [];
};

const extractJsonPayload = (rawText = "") => {
  let text = rawText.trim();
  if (!text) return null;

  text = text.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

  const direct = tryParseJson(text);
  if (direct) return direct;

  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const parsed = tryParseJson(objectMatch[0]);
    if (parsed) return parsed;
  }

  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    const parsed = tryParseJson(arrayMatch[0]);
    if (parsed) return parsed;
  }

  return null;
};

export const extractSmartReplySuggestions = (rawText = "", maxItems = 3, maxLength = 120) => {
  const payload = extractJsonPayload(rawText);
  if (!payload) return [];

  const rawList = collectFromParsed(payload);
  return normalizeSuggestionList(rawList, maxItems, maxLength);
};
