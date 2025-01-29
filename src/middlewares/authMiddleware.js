import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { HttpStatusCode, ResponseError } from '../utils/types.js';
import config from '../config/config.js';

export const authenticateUser = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error: ResponseError.UNAUTHORIZED,
      message: 'Not authorized, no token',
    });
  }

  try {
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = await User.findById(decoded.id).select('-password');
    if(!req.user) {
      return res.status(HttpStatusCode.UNAUTHORIZED).json({
        error: ResponseError.UNAUTHORIZED,
        message: 'Not authorized, no user',
      });
    }
    next();
  } catch (err) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error: ResponseError.UNAUTHORIZED,
      message: 'Not authorized: ' + err.message,
    });
  }
};
