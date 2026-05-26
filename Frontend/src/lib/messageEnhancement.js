export const ENHANCEMENT_TONES = [
  { id: "professional", label: "Professional" },
  { id: "formal", label: "Formal" },
  { id: "polite", label: "Polite" },
  { id: "friendly", label: "Friendly" },
  { id: "short", label: "Short" },
  { id: "confident", label: "Confident" },
  { id: "casual", label: "Casual" },
  { id: "persuasive", label: "Persuasive" },
];

export const getEnhanceableMessage = (message = "") => message.trim();

export const canEnhanceMessage = (message = "") => {
  const text = getEnhanceableMessage(message);

  return text.length >= 4 && /[\p{L}\p{N}]/u.test(text);
};
