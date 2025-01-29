import express from 'express';
import cookieParser from 'cookie-parser';
import connectDB from './config/dbConfig.js';
import userRoutes from './routes/userRoutes.js';
import sessionRoutes from './routes/sessionRoutes.js';
import proposalRoutes from './routes/proposalRoutes.js';

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use('/api/v1/user', userRoutes);
app.use('/api/v1/session', sessionRoutes);
app.use('/api/v1/proposal', proposalRoutes);

connectDB();

export default app;
