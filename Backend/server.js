import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import authRoutes from './src/routes/authRoutes.js';
const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

app.listen(5000, () => {
    console.log("server is running on port ",process.env.PORT);
})