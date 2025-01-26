import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import authRoutes from '../routes/authRoute.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGODB_URL, {
    dbName: process.env.MONGODB_DB_NAME,
    user: process.env.MONGODB_USER,
    pass: process.env.MONGODB_PASS,
  })
  .then(() => {
    console.log('Database connected');
  })
  .catch((err) => {
    console.log('Database not connected: ' + err);
  });

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
