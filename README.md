# realTime-chat-platform

Real-time chat with JWT auth, Socket.IO, Gemini smart replies, and AI message enhancement.

## AI Features

1. Copy `Backend/.env.example` to `Backend/.env`.
2. Set `GEMINI_API_KEY` from Google AI Studio.
3. Optional: set `GEMINI_MODEL` if you want a model other than `gemini-2.0-flash`.
4. Start the backend and frontend.

Smart replies appear above the message input when the latest chat message is from another user.

REST:
- `GET /api/ai/status`
- `GET /api/ai/smart-replies/:chatId`
- `POST /api/ai/enhance-message`

Socket:
- `smartReplies:request` uses acknowledgement callbacks only, with no broadcast.
