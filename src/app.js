import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './config/dbConfig.js';
import userRoutes from './routes/userRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/session', sessionRoutes);

connectDB();

export default app;
