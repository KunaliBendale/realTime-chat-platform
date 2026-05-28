import { aiConfig } from "../config/ai.config.js";

export const smartReplyResponseSchema = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: aiConfig.smartReply.maxSuggestions,
    },
  },
  required: ["suggestions"],
};

export const buildSmartReplyPrompt = ({
  currentUserName,
  chatName,
  isGroup,
  messages = [],
  lastIncomingMessage = null,
}) => {
  const transcript = messages
    .map((message) => {
      const role = message.isOwn ? currentUserName : message.senderName;
      const content = message.content?.trim();
      if (!content) return null;
      return `${role}: ${content}`;
    })
    .filter(Boolean)
    .join("\n");

  const replyTarget = lastIncomingMessage?.content?.trim() || "";
  const replyFrom = lastIncomingMessage?.senderName || chatName;

  const systemPrompt = `You generate smart-reply suggestions for a chat app.

Task: Write exactly ${aiConfig.smartReply.maxSuggestions} short messages that ${currentUserName} would send as their NEXT reply.

Output format (only this, nothing else):
{"suggestions":["reply one","reply two","reply three"]}

Requirements:
- Each reply must directly answer or respond to the LATEST incoming message
- First person, natural texting style, max ${aiConfig.smartReply.maxSuggestionLength} characters each
- All ${aiConfig.smartReply.maxSuggestions} replies must be different from each other
- Answer the actual topic asked (studies, health, plans, feelings, etc.)
- Never use generic deflections like "good question", "let me think", "I'll get back to you", or "not sure yet" unless the message is truly unanswerable
- No markdown, no preamble, no labels`;

  const userPrompt = `Chat: ${isGroup ? `Group "${chatName}"` : `Direct chat with ${chatName}`}
You write as: ${currentUserName}

Conversation:
${transcript || "(no prior messages)"}

LATEST MESSAGE (from ${replyFrom}) - reply to THIS only:
"${replyTarget}"

Examples of correct behavior:
- If they ask "How are you?" -> replies about how you are doing
- If they ask "How are your studies going?" -> replies about studies progress
- If they say "Thanks!" -> replies like "You're welcome" / "Anytime"

Return JSON only.`;

  return { systemPrompt, userPrompt, transcript };
};

export const buildSmartReplyRetryPrompt = ({ currentUserName, lastIncomingMessage }) => {
  const target = lastIncomingMessage?.content?.trim() || "";

  return {
    systemPrompt:
      'Return only JSON: {"suggestions":["a","b","c"]}. Three short chat replies, first person, under 100 characters. Answer the question directly.',
    userPrompt: `As "${currentUserName}", write 3 different natural replies to:\n"${target}"\n\nJSON only, no other text.`,
  };
};
