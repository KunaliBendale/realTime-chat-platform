# realTime-chat-platform

Real-time chat with JWT auth, Socket.IO, and **AI smart reply suggestions** (Google Gemini by default).

## AI Smart Replies

1. Copy `Backend/.env.example` → `Backend/.env`
2. Set `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/apikey)
3. Start backend + frontend; open a chat where the **last message is from the other person**
4. Suggestions appear above the input (tap to autofill)

Switch provider: `AI_PROVIDER=openai` or `claude` and set the matching API key.

API: `GET /api/ai/smart-replies/:chatId` · Socket: `smartReplies:request` (ack only, no broadcast)