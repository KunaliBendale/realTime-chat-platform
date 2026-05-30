const clean = (value = "") => value.toString().replace(/\s+/g, " ").trim();

const unique = (items = [], maxItems = 3) => {
  const seen = new Set();
  const results = [];

  for (const item of items) {
    const text = clean(item);
    const key = text.toLowerCase();
    if (!text || seen.has(key)) continue;
    seen.add(key);
    results.push(text);
    if (results.length >= maxItems) break;
  }

  return results;
};

export const buildFallbackSmartReplies = (incomingMessage = "", maxItems = 3) => {
  const text = clean(incomingMessage).toLowerCase();

  if (/\b(thanks|thank you|tysm|appreciate)\b/.test(text)) {
    return unique(["You're welcome!", "Anytime!", "Glad to help."], maxItems);
  }

  if (/\bhow are you\b|\bhru\b|\bhow's it going\b/.test(text)) {
    return unique(
      ["I'm doing well, thanks!", "Pretty good, how about you?", "I'm good, thanks for asking."],
      maxItems,
    );
  }

  if (/\breport\b|\bfile\b|\bdocument\b|\bsend\b|\bshare\b/.test(text)) {
    return unique(
      ["Sure, I'll send it soon.", "Yes, I'll share it shortly.", "I'll send it over in a bit."],
      maxItems,
    );
  }

  if (/\bstudy|studies|exam|assignment|college|class\b/.test(text)) {
    return unique(
      ["It's going well so far.", "A bit busy, but manageable.", "I'm keeping up with it."],
      maxItems,
    );
  }

  if (/\bmeet|meeting|call|available|free\b/.test(text)) {
    return unique(
      ["Yes, that works for me.", "I can make that work.", "Let me confirm and get back to you."],
      maxItems,
    );
  }

  if (text.endsWith("?")) {
    return unique(
      ["Yes, that sounds good.", "I think that works.", "Let me check and confirm."],
      maxItems,
    );
  }

  return unique(["Okay, got it.", "Sure, sounds good.", "Thanks for letting me know."], maxItems);
};

const lowerFirst = (value = "") =>
  value ? `${value.charAt(0).toLowerCase()}${value.slice(1)}` : "";

const ensurePunctuation = (value = "") => {
  const text = clean(value);
  if (!text) return "";
  return /[.!?]$/.test(text) ? text : `${text}.`;
};

const softenUrgency = (message = "") =>
  clean(message)
    .replace(/\bquickly\b/gi, "as soon as possible")
    .replace(/\basap\b/gi, "as soon as possible")
    .replace(/\bright now\b/gi, "when you can");

const formalizeStatement = (message = "") =>
  clean(message)
    .replace(/^sure,\s*i['’]ll\b/i, "I will")
    .replace(/^yes,\s*i['’]ll\b/i, "I will")
    .replace(/\bi['’]ll\b/gi, "I will")
    .replace(/\bcan't\b/gi, "cannot")
    .replace(/\bdon't\b/gi, "do not")
    .replace(/\bwon't\b/gi, "will not");

const looksLikeStatement = (message = "") =>
  /^(i|i will|we|you|sure|yes|no|okay|ok|thanks|thank you)\b/i.test(clean(message));

const prefixRequest = (message = "", prefix = "Please") => {
  const text = softenUrgency(message);
  if (/^(please|could you|can you|would you)\b/i.test(text)) {
    return ensurePunctuation(text);
  }

  if (looksLikeStatement(text)) {
    return ensurePunctuation(formalizeStatement(text));
  }

  return ensurePunctuation(`${prefix} ${lowerFirst(text)}`);
};

export const buildFallbackEnhancement = ({ message, tone }) => {
  const text = softenUrgency(message);

  switch (tone) {
    case "formal":
      return looksLikeStatement(text)
        ? ensurePunctuation(formalizeStatement(text))
        : prefixRequest(text, "Could you please");
    case "polite":
      return looksLikeStatement(text)
        ? ensurePunctuation(formalizeStatement(text))
        : prefixRequest(text, "Could you please");
    case "professional":
      return prefixRequest(text, "Please");
    case "friendly":
      return prefixRequest(text, "Could you");
    case "short":
      return ensurePunctuation(text);
    case "confident":
      return prefixRequest(text, "Please");
    case "casual":
      return ensurePunctuation(text);
    case "persuasive":
      return prefixRequest(text, "Please");
    default:
      return ensurePunctuation(text);
  }
};
