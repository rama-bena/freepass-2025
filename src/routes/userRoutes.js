import express from 'express';
import { protect } from '../middlewares/authMiddleware.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUserProfile,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', protect, logoutUser);
router.get('/', protect, getUsers);
router.get('/:username', protect, getUserProfile);

export default router;
