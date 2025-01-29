import express from 'express';
import authenticateUser from '../middlewares/authMiddleware.js';
import checkUserRole from '../middlewares/roleMiddleware.js';
import {
  getAllSessions,
  registerForSession,
  editSession,
  deleteSession,
  getSessionProposals,
} from '../controllers/sessionController.js';
import { Role } from '../utils/types.js';

const router = express.Router();

router.get('/', getAllSessions);
router.post('/:sessionId/register', authenticateUser, registerForSession);
router.put('/:sessionId', authenticateUser, editSession);
router.delete(
  '/:sessionId',
  authenticateUser,
  checkUserRole(Role.EVENT_COORDINATOR, Role.USER),
  deleteSession
);
router.get(
  '/proposals',
  authenticateUser,
  checkUserRole([Role.EVENT_COORDINATOR]),
  getSessionProposals
);

export default router;
