import express from 'express';
import connectDB from './config/dbConfig.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/users', userRoutes);

connectDB();

export default app;
