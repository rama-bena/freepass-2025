import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { HttpStatusCode, ResponseError } from '../utils/types.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

export const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    logger.warn('Unauthorized access attempt: No token provided');
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error: ResponseError.UNAUTHORIZED,
      message: 'Not authorized, no token',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) {
      logger.warn(
        `Unauthorized access attempt: User not found for token ${decoded.id}`
      );
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        error: ResponseError.UNAUTHORIZED,
        message: 'Not authorized, no user',
      });
    }
    logger.info(`User authenticated: ${req.user.email}`);
    next();
  } catch (err) {
    logger.error(`Authentication failed: ${err.message}`, { error: err.stack });
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error: ResponseError.UNAUTHORIZED,
      message: 'Not authorized: ' + err.message,
    });
  }
};
