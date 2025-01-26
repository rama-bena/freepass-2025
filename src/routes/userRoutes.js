import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
} from '../controllers/userController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/', protect, getUsers);

export default router;
