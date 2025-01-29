import express from 'express';
import authenticateUser from '../middlewares/authMiddleware.js';
import {
  getAllSessions,
  registerForSession,
  editSession,
  deleteSession,
} from '../controllers/sessionController.js';

const router = express.Router();

router.get('/', getAllSessions);
router.post('/:sessionId/register', authenticateUser, registerForSession);
router.put('/:sessionId', authenticateUser, editSession);
router.delete('/:sessionId', authenticateUser, deleteSession);

export default router;
