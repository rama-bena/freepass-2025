import express from 'express';
import authRoutes from '../routes/authRoute.js';

const app = express();
const PORT = 3000;

app.use('/api/auth', authRoutes);

app.listen(PORT, () => {
  console.log(`App listening at http://localhost:${PORT}`);
});
