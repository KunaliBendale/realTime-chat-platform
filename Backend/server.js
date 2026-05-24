import express from 'express';
import connectDB from './src/DB/connectDB.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import {server,app} from './src/utils/socket.js';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './src/routes/authRoutes.js';
import chatRoutes from './src/routes/chatRoutes.js';
import contactRoutes from './src/routes/contactRoutes.js';
import aiRoutes from './src/ai/routes/aiRoutes.js';


// Connect Database
connectDB();

//Middlewares
const allowedOrigins = process.env.CLIENT_URL
  ? [
      ...process.env.CLIENT_URL.split(",").map((origin) => origin.trim()),
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ]
  : ["http://localhost:5173", "http://127.0.0.1:5173"];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/ai", aiRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log("server is running on port ", PORT);
})
