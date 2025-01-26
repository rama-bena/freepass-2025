import app from './app.js';
import dotenv from 'dotenv';
import config from './config/config.js';
dotenv.config();

const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
