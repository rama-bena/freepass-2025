import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

router.get('/register', authController.register);

export default router;
