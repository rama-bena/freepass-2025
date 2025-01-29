import express from 'express';
import { authenticateUser } from '../middlewares/authMiddleware.js';
import { createProposal } from '../controllers/proposalController.js';

const router = express.Router();

router.post('/', authenticateUser, createProposal);

export default router;
