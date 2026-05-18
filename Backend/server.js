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


// Connect Database
connectDB();

//Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(process.cwd(), "public")));

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);

server.listen(5000, () => {
    console.log("server is running on port ",process.env.PORT);
})