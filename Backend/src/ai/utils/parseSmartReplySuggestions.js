import { normalizeSuggestionList } from "./suggestionValidation.js";

const SUGGESTION_KEYS = ["suggestions", "replies", "reply", "responses", "options"];

const normalizeModelText = (rawText = "") =>
  rawText
    .replace(/^\uFEFF/, "")
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .trim();

const tryParseJson = (text = "") => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const collectSuggestions = (value, depth = 0) => {
  if (depth > 8 || value == null) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    const parsed = tryParseJson(value.trim());
    return parsed ? collectSuggestions(parsed, depth + 1) : [];
  }

  if (typeof value !== "object") return [];

  for (const key of SUGGESTION_KEYS) {
    if (Array.isArray(value[key])) return value[key];
  }

  for (const nested of Object.values(value)) {
    const found = collectSuggestions(nested, depth + 1);
    if (found.length) return found;
  }

  return [];
};

const extractJsonPayloads = (text = "") => {
  const payloads = [];
  const direct = tryParseJson(text);
  if (direct) payloads.push({ value: direct, source: "direct_json" });

  const objectMatches = text.match(/\{[\s\S]*?\}/g) || [];
  objectMatches.forEach((candidate) => {
    const parsed = tryParseJson(candidate);
    if (parsed) payloads.push({ value: parsed, source: "object_match" });
  });

  const arrayMatches = text.match(/\[[\s\S]*?\]/g) || [];
  arrayMatches.forEach((candidate) => {
    const parsed = tryParseJson(candidate);
    if (parsed) payloads.push({ value: parsed, source: "array_match" });
  });

  return payloads;
};

const recoverStringsFromSuggestionsBlock = (text = "") => {
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

const extractLineSuggestions = (text = "") => {
  return text
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/^\s*[-*•]\s*/, "")
        .replace(/^\s*\d+[.)]\s*/, "")
        .replace(/^\s*(reply|option|suggestion)\s*\d*\s*:\s*/i, "")
        .replace(/^["']+|["']+$/g, "")
        .trim(),
    )
    .filter(Boolean);
};

export const parseSmartReplySuggestions = (
  rawText = "",
  maxItems = 3,
  maxLength = 120,
) => {
  const text = normalizeModelText(rawText);
  if (!text) return { suggestions: [], source: "empty" };

  for (const payload of extractJsonPayloads(text)) {
    const suggestions = normalizeSuggestionList(
      collectSuggestions(payload.value),
      maxItems,
      maxLength,
    );

    if (suggestions.length) {
      return { suggestions, source: payload.source };
    }
  }

  const recovered = normalizeSuggestionList(
    recoverStringsFromSuggestionsBlock(text),
    maxItems,
    maxLength,
  );

  if (recovered.length) {
    return { suggestions: recovered, source: "recovered_json" };
  }

  const lineSuggestions = normalizeSuggestionList(
    extractLineSuggestions(text),
    maxItems,
    maxLength,
  );

  if (lineSuggestions.length) {
    return { suggestions: lineSuggestions, source: "line_recovery" };
  }

  return { suggestions: [], source: "none" };
};

export const resolveSmartReplySuggestions = (
  result = {},
  maxItems = 3,
  maxLength = 120,
) => {
  const structured = normalizeSuggestionList(
    result.json?.suggestions || result.suggestions,
    maxItems,
    maxLength,
  );

  if (structured.length) {
    return { suggestions: structured, source: "gemini_json" };
  }

  return parseSmartReplySuggestions(result.text || "", maxItems, maxLength);
};
