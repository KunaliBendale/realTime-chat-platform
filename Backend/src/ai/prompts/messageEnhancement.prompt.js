export const MESSAGE_ENHANCEMENT_TONES = {
  professional: "clear, polished, and workplace appropriate",
  formal: "more formal, respectful, and structured",
  polite: "warm, considerate, and courteous",
  friendly: "friendly, natural, and approachable",
  short: "shorter, direct, and still complete",
  confident: "confident, clear, and assertive without sounding rude",
  casual: "casual, relaxed, and conversational",
  persuasive: "persuasive, helpful, and action-oriented without pressure",
};

export const normalizeEnhancementTone = (tone = "") => {
  const normalizedTone = tone.toString().trim().toLowerCase();

  return MESSAGE_ENHANCEMENT_TONES[normalizedTone] ? normalizedTone : null;
};

export const buildMessageEnhancementPrompt = ({ message, tone }) => {
  const toneDescription = MESSAGE_ENHANCEMENT_TONES[tone];
  const toneInstruction =
    tone === "short"
      ? "Shorten the message while preserving every essential detail."
      : tone === "persuasive"
        ? "Make the message more convincing and action-oriented, but keep it concise and complete."
        : `Make the message ${toneDescription}.`;

  return {
    systemPrompt: `You rewrite chat messages for a realtime messaging app.

Rules:
- Preserve the original meaning and intent.
- Rewrite the entire message from start to finish.
- Always return a complete sentence or complete set of sentences.
- Change only tone, clarity, and wording.
- Keep it natural, human, and concise.
- Keep chat-style formatting if the user used line breaks.
- Do not add new facts, promises, dates, names, emojis, signatures, or explanations.
- Do not make the message robotic or overly verbose.
- Do not return markdown, bullet points, labels, or surrounding quotes.
- If the source message is long, rewrite the full message without cutting it off.
- Return JSON only with this shape: {"enhancedMessage":"..."}`,

    userPrompt: `Tone: ${tone} (${toneDescription})
Instruction: ${toneInstruction}

Original message:
"""${message}"""

Rewrite the full original message in the requested tone. Return only valid JSON.`,
  };
};

export const messageEnhancementResponseSchema = {
  type: "object",
  properties: {
    enhancedMessage: {
      type: "string",
    },
  },
  required: ["enhancedMessage"],
};