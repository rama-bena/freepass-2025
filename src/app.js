import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './config/dbConfig.js';
import userRoutes from './routes/userRoutes.js';

const app = express();


app.use(cors({
  origin: 'http://localhost:1234',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/api/users', userRoutes);

connectDB();

export default app;
