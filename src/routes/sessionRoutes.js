import express from 'express';
import { authenticateUser } from '../middlewares/authMiddleware.js';
import {
  getAllSessions,
  registerForSession,
} from '../controllers/sessionController.js';

const router = express.Router();

router.get('/', getAllSessions);
router.post('/:sessionId/register', authenticateUser, registerForSession);

export default router;
