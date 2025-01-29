import express from 'express';
import { authenticateUser } from '../middlewares/authMiddleware.js';
import {
  registerUser,
  loginUser,
  logoutUser,
  getUsers,
  getUserProfile,
  updateUserProfile,
} from '../controllers/userController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/logout', authenticateUser, logoutUser);
router.get('/', authenticateUser, getUsers);
router.get('/:username', authenticateUser, getUserProfile);
router.put('/profile', authenticateUser, updateUserProfile);

export default router;
