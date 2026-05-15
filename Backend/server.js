import express from 'express';
import connectDB from './src/DB/connectDB.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './src/routes/authRoutes.js';


const app = express();
connectDB();
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);

app.listen(5000, () => {
    console.log("server is running on port ",process.env.PORT);
})