import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { HttpStatusCode, ResponseError } from '../utils/types.js';
import config from '../config/config.js';

export const protect = async (req, res, next) => {
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
    next();
  } catch (err) {
    return res.status(HttpStatusCode.UNAUTHORIZED).json({
      error: ResponseError.UNAUTHORIZED,
      message: 'Not authorized, token failed',
    });
  }
};
