# 💬 Real-Time Chat Platform

A full-stack real-time chat application built with the **MERN Stack**, **Socket.IO**, **Google OAuth**, **Gemini AI**, and **Cloudinary**.

The application enables users to communicate instantly through one-to-one and group conversations while also leveraging AI-powered features such as message enhancement and smart reply suggestions. Images and media are securely uploaded to Cloudinary, and authentication supports both traditional email/password login and Google OAuth.

# ✨ Features
## 🔐 Authentication
- User Registration
- User Login
- Secure Password Hashing (bcrypt)
- JWT Authentication
- Google OAuth Sign In
- Protected Routes

## 💬 Chat Management

- Real-Time One-to-One Chat
- Real-Time Group Chat
- Create Groups
- Rename Groups
- Add Members
- Remove Members
- Online User Status
- Typing Indicator
- Read Receipts
- Message Timestamp
- Last Message Preview
- Auto Scroll to Latest Message


## 🤖 AI Features

Powered by **Google Gemini**

- Smart Reply Suggestions
- AI Message Enhancement

# 🛠 Tech Stack

## Frontend

- React.js
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client

## Backend

- Node.js
- Express.js
- Socket.IO
- MongoDB
- Mongoose

## Authentication

- JWT
- Google OAuth


## File Storage

- Multer
- Cloudinary

Create a `.env` file inside the **Backend** directory.
##.env example

MONGODB_URI=""
PORT=5000
JWT_SECRET=''
EMAIL_USER=''
EMAIL_PASS=''

CLIENT_URL='http://localhost:5173'

CLIENT_ID=""
CLIENT_SECRET=""
GOOGLE_CALLBACK_URL='http://localhost:5000/api/auth/google/callback'

//cloud
CLOUD_NAME=''
API_KEY=''
API_SECRET=''

GEMINI_API_KEY=''
AI_ENABLED=true
GEMINI_MODEL=gemini-3.5-flash
GEMINI_FALLBACK_MODELS=gemini-2.0-flash
OTP_DEV_FALLBACK=true

# Chat media
CHAT_IMAGE_MAX_BYTES=4194304
SOCKET_MAX_HTTP_BUFFER_BYTES=6291456


AI_SMART_REPLY_MAX_MESSAGES=12
AI_SMART_REPLY_MAX_SUGGESTIONS=3
AI_SMART_REPLY_MAX_LENGTH=120
AI_REQUEST_TIMEOUT_MS=12000
AI_CACHE_TTL_MS=300000
AI_RATE_LIMIT_WINDOW_MS=60000
AI_RATE_LIMIT_MAX_REQUESTS=15
AI_MAX_RETRIES=2
AI_DEBUG=true

AI_ENHANCE_MAX_INPUT_LENGTH=800
AAI_ENHANCE_MAX_OUTPUT_LENGTH=1600
AI_ENHANCE_MAX_OUTPUT_TOKENS=1024
AI_ENHANCE_REQUEST_TIMEOUT_MS=18000
AI_ENHANCE_MIN_LENGTH=4
AI_ENHANCE_CACHE_TTL_MS=120000


# ⭐ Support

If you found this project useful, don't forget to leave a ⭐ on the repository.
