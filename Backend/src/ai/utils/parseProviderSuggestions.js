import { extractSmartReplySuggestions } from "./extractSmartReplySuggestions.js";
import { normalizeSuggestionList } from "./suggestionValidation.js";

const SUGGESTION_KEYS = ["suggestions", "replies", "reply", "responses", "options"];

const normalizeProviderText = (rawText = "") =>
  rawText
    .replace(/^\uFEFF/, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();

const tryParseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const deepFindSuggestionsArray = (value, depth = 0) => {
  if (depth > 10 || value == null) return null;

  if (Array.isArray(value)) {
    const hasUsableItems = value.some(
      (item) =>
        typeof item === "string" ||
        (item && typeof item === "object" && (item.text || item.message || item.reply)),
    );
    if (hasUsableItems) return value;
    return null;
  }

  if (typeof value === "object") {
    for (const key of SUGGESTION_KEYS) {
      if (Array.isArray(value[key])) return value[key];
    }

    for (const nested of Object.values(value)) {
      const found = deepFindSuggestionsArray(nested, depth + 1);
      if (found) return found;
    }
  }

  return null;
};

/** Pull string values from a broken/truncated suggestions array in JSON text. */
const extractStringsFromSuggestionsBlock = (text = "") => {
  const blockMatch = text.match(/"suggestions"\s*:\s*\[([\s\S]*?)(?:\]|$)/i);
  if (!blockMatch?.[1]) return [];

  const results = [];
  const stringPattern = /"((?:\\.|[^"\\])*)"/g;
  let match = stringPattern.exec(blockMatch[1]);

  while (match) {
    try {
      results.push(JSON.parse(`"${match[1]}"`));
    } catch {
      results.push(match[1].replace(/\\"/g, '"'));
    }
    match = stringPattern.exec(blockMatch[1]);
  }

  return results;
};

const collectSuggestionItems = (parsed) => {
  if (parsed == null) return [];

  if (Array.isArray(parsed)) return parsed;

  const deep = deepFindSuggestionsArray(parsed);
  if (deep) return deep;

  if (typeof parsed === "object") {
    for (const key of SUGGESTION_KEYS) {
      if (Array.isArray(parsed[key])) return parsed[key];
    }
  }

  return [];
};

/**
 * Parse model output into validated suggestion strings.
 */
export const parseProviderSuggestions = (rawText = "", maxItems = 3, maxLength = 120) => {
  const normalized = normalizeProviderText(rawText);
  if (!normalized) {
    return { suggestions: [], source: "empty" };
  }

  const extracted = extractSmartReplySuggestions(normalized, maxItems, maxLength);
  if (extracted.length) {
    return { suggestions: extracted, source: "extracted" };
  }

  const direct = tryParseJson(normalized);
  if (direct) {
    const items = collectSuggestionItems(direct);
    const sanitized = normalizeSuggestionList(items, maxItems, maxLength);
    if (sanitized.length) {
      return { suggestions: sanitized, source: "direct_json" };
    }
  }

  const objectMatch = normalized.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    const parsed = tryParseJson(objectMatch[0]);
    if (parsed) {
      const items = collectSuggestionItems(parsed);
      const sanitized = normalizeSuggestionList(items, maxItems, maxLength);
      if (sanitized.length) {
        return { suggestions: sanitized, source: "object_match" };
      }
    }
  }

  const recovered = extractStringsFromSuggestionsBlock(normalized);
  const sanitizedRecovered = normalizeSuggestionList(recovered, maxItems, maxLength);
  if (sanitizedRecovered.length) {
    return { suggestions: sanitizedRecovered, source: "recovered_strings" };
  }

  return { suggestions: [], source: "none" };
};

/**
 * Prefer provider-parsed array, then full parse pipeline.
 */
export const resolveSuggestionsFromProviderResult = (
  result = {},
  maxItems = 3,
  maxLength = 120,
) => {
  if (Array.isArray(result.suggestions) && result.suggestions.length) {
    const fromProvider = normalizeSuggestionList(result.suggestions, maxItems, maxLength);
    if (fromProvider.length) {
      return { suggestions: fromProvider, source: "provider_array" };
    }
  }

  return parseProviderSuggestions(result.text || "", maxItems, maxLength);
};
