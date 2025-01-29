import express from 'express';
import authenticateUser from '../middlewares/authMiddleware.js';
import checkUserRole from '../middlewares/roleMiddleware.js';
import {
  addEventCoordinator,
  removeUser,
} from '../controllers/adminController.js';
import { Role } from '../utils/types.js';

const router = express.Router();

router.patch(
  '/user/:userId/event-coordinator',
  authenticateUser,
  checkUserRole([Role.ADMIN]),
  addEventCoordinator
);

router.delete(
  '/user/:userId',
  authenticateUser,
  checkUserRole([Role.ADMIN]),
  removeUser
);

export default router;
