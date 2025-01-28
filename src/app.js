import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './config/dbConfig.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/user', userRoutes);

connectDB();

export default app;
