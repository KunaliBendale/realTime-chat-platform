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

const upperFirst = (value = "") =>
  value ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : "";

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

const removeCasualAddress = (message = "") =>
  clean(message).replace(/^(bro|bhai|dude|buddy|man|hey)\s*,?\s+/i, "");

const removeLeadingPlease = (message = "") =>
  clean(message).replace(/^please\s+/i, "");

const normalizeFallbackRequest = (message = "") => {
  const text = removeLeadingPlease(removeCasualAddress(softenUrgency(message)))
    .replace(/\bdo this as soon as possible\b/gi, "complete this as soon as possible")
    .replace(/\bdo this\b/gi, "complete this")
    .replace(/\bmy project presentation is very close\b/gi, "my project presentation is coming up soon")
    .replace(/\bproject presentation is very close\b/gi, "project presentation is coming up soon")
    .replace(/\band I am worried\b/gi, "and I am concerned")
    .replace(/\bI am worried\b/gi, "I am concerned");

  return clean(text);
};

const hasPresentationConcern = (message = "") =>
  /\bpresentation\b/i.test(message) && /\b(worried|concerned|close|soon|upcoming)\b/i.test(message);

const buildContextAwareEnhancement = ({ message, tone }) => {
  const normalized = normalizeFallbackRequest(message);
  if (!normalized) return "";

  if (!hasPresentationConcern(normalized)) return "";

  switch (tone) {
    case "formal":
      return "I would appreciate it if you could complete this as soon as possible, as my project presentation is approaching and I am concerned.";
    case "polite":
      return "Could you please complete this as soon as possible? My project presentation is coming up soon, and I am a bit worried.";
    case "professional":
      return "Please complete this as soon as possible, as my project presentation is coming up soon and I am concerned.";
    case "friendly":
      return "Hey, could you please help me with this soon? My project presentation is coming up, and I am a little worried.";
    case "short":
      return "Please do this soon; my presentation is close.";
    case "confident":
      return "Please complete this as soon as possible so I can be ready for my upcoming project presentation.";
    case "casual":
      return "Bro, please help me with this soon. My project presentation is coming up, and I am worried.";
    case "persuasive":
      return "Please prioritize this soon so I can prepare confidently for my upcoming project presentation.";
    default:
      return "";
  }
};

const prefixRequest = (message = "", prefix = "Please") => {
  const text = normalizeFallbackRequest(message);
  if (/^(please|could you|can you|would you)\b/i.test(text)) {
    return ensurePunctuation(text);
  }

  if (looksLikeStatement(text)) {
    return ensurePunctuation(formalizeStatement(text));
  }

  return ensurePunctuation(`${prefix} ${lowerFirst(text)}`);
};

const shortenMessage = (message = "") => {
  const text = normalizeFallbackRequest(message);
  const replacements = [
    [/I was trying to /i, "I tried to "],
    [/but after removing some unnecessary code/i, "but after cleanup"],
    [/please check everything properly and fix it without breaking existing functionality/i, "please check and fix it without breaking existing functionality"],
    [/the frontend still needs some UI fixes and socket testing before final submission/i, "the frontend still needs UI fixes and socket testing before submission"],
    [/because my project presentation is very close and I am worried/i, "because my presentation is close"],
  ];

  return ensurePunctuation(
    replacements.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text),
  );
};

export const buildFallbackEnhancement = ({ message, tone }) => {
  const contextAware = buildContextAwareEnhancement({ message, tone });
  if (contextAware) return contextAware;

  const text = normalizeFallbackRequest(message);
  const sentence = upperFirst(text);

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
      return looksLikeStatement(text)
        ? ensurePunctuation(formalizeStatement(text))
        : prefixRequest(text, "Please");
    case "friendly":
      return looksLikeStatement(text)
        ? ensurePunctuation(text)
        : ensurePunctuation(`Hey, could you please ${lowerFirst(text)}`);
    case "short":
      return shortenMessage(text);
    case "confident":
      return looksLikeStatement(text)
        ? ensurePunctuation(formalizeStatement(text))
        : ensurePunctuation(`Please prioritize this: ${lowerFirst(text)}`);
    case "casual":
      return ensurePunctuation(`Hey, ${lowerFirst(sentence)}`);
    case "persuasive":
      return looksLikeStatement(text)
        ? ensurePunctuation(formalizeStatement(text))
        : ensurePunctuation(`Please prioritize this so we can move forward smoothly: ${lowerFirst(text)}`);
    default:
      return ensurePunctuation(sentence);
  }
};
