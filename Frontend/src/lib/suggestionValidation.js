/** Mirror of Backend/src/ai/utils/suggestionValidation.js */

const DEFLECTION_PATTERNS = [
  /^good question\b/i,
  /^let me (think|get back)\b/i,
  /^i'?ll get back to you\b/i,
  /^not sure yet\b/i,
  /^i don'?t know yet\b/i,
];

const META_PATTERNS = [
  /^here (is|are)\b/i,
  /^sure[,!]?\s+(here|is|are|below|the following)\b/i,
  /^certainly[,!]?\s+(here|is|are|below)\b/i,
  /^below\b/i,
  /^the following\b/i,
  /^as requested\b/i,
  /^json\b/i,
  /\bjson\s+requested\b/i,
  /\brequested\s*:/i,
  /\bformat\b.*\bjson\b/i,
  /\bsuggestions?\s*:\s*\[/i,
  /^reply\s*\d+\s*:/i,
  /^option\s*\d+\s*:/i,
  /^```/,
  /```/,
  /^"suggestions"\s*:/i,
  /^\s*\{\s*"suggestions"/i,
  /^\s*\x5B\s*"/,
];

const looksLikeMetaOrJson = (value = "") => {
  const trimmed = value.trim();
  if (!trimmed) return true;

  for (const pattern of [...DEFLECTION_PATTERNS, ...META_PATTERNS]) {
    if (pattern.test(trimmed)) return true;
  }

  if (/^\s*[\x5B{]/.test(trimmed) && /[}\x5D]\s*$/.test(trimmed)) return true;

  return false;
};

export const isValidReplySuggestion = (value, maxLength = 120) => {
  if (typeof value !== "string") return false;

  const trimmed = value
    .replace(/```(?:json)?/gi, "")
    .replace(/```/g, "")
    .replace(/^["']+|["']+$/g, "")
    .trim();

  if (!trimmed || trimmed.length < 2 || trimmed.length > maxLength) return false;
  if (trimmed === "[object Object]") return false;
  if (looksLikeMetaOrJson(trimmed)) return false;
  if (trimmed.split(/\s+/).length > 25) return false;

  return true;
};

export const normalizeSuggestionList = (items = [], maxItems = 3, maxLength = 120) => {
  if (!Array.isArray(items)) return [];

  const seen = new Set();
  const results = [];

  for (const item of items) {
    let text = typeof item === "string" ? item : item?.text || item?.message || "";

    if (!isValidReplySuggestion(text, maxLength)) continue;

    const normalized = text
      .replace(/```(?:json)?/gi, "")
      .replace(/```/g, "")
      .replace(/^["']+|["']+$/g, "")
      .trim();

    const key = normalized.toLowerCase();
    if (seen.has(key)) continue;

    seen.add(key);
    results.push(normalized);

    if (results.length >= maxItems) break;
  }

  return results;
};
