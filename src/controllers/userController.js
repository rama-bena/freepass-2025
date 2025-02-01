import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { Role, HttpStatusCode, ResponseError } from '../utils/types.js';
import config from '../config/config.js';
import logger from '../utils/logger.js';

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export async function registerUser(req, res) {
  const { username, email, password, role } = req.body;
  try {
    logger.info(`Attempting to register user: ${email}`);
    const userExists = await User.findOne({ email });
    if (userExists) {
      logger.warn(`User already exists: ${email}`);
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.CONFLICT,
        message: 'User already exists',
      });
    }

    const user = new User({ username, password, email, role });
    await user.save();
    logger.info(`User registered successfully: ${email}`);
    return res.status(HttpStatusCode.CREATED).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    logger.error(`Register failed for ${email}: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: 'Register not successful: ' + err.message,
    });
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    logger.info(`Login attempt for user: ${email}`);
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      logger.warn(`Invalid login attempt for user: ${email}`);
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.INVALID,
        message: 'Email or password wrong',
      });
    }

    const token = generateToken(user._id);
    res.cookie('token', token, config.cookie.login);
    logger.info(`User logged in successfully: ${email}`);
    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    logger.error(`Login failed for ${email}: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.LOGIN_FAILED,
      message: 'Login not successful: ' + err.message,
    });
  }
}

export async function logoutUser(req, res) {
  const userId = req.user?._id;
  logger.info(`User logging out: ${userId}`);
  res.cookie('token', '', config.cookie.logout);
  return res.json({ message: 'User logged out successfully' });
}

export const getUsers = async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.token, config.jwt.secret);
    const adminUser = await User.findById(decoded.id);
    if (adminUser.role !== Role.ADMIN) {
      logger.warn(
        `Unauthorized access attempt to getUsers by user: ${decoded.id}`
      );
      return res.status(HttpStatusCode.FORBIDDEN).json({
        error: ResponseError.ADMIN_ONLY,
        message: 'Forbidden: Admins only',
      });
    }

    const users = await User.find({}).select('-password');
    logger.info(`Admin ${decoded.id} retrieved user list`);
    return res.json(users);
  } catch (err) {
    logger.error(`Error retrieving users: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: `Error retieving users: ${err.message}`,
    });
  }
};

export async function getUserProfile(req, res) {
  const { username } = req.params;
  try {
    logger.info(`Fetching profile for user: ${username}`);
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      logger.warn(`User not found: ${username}`);
      return res.status(HttpStatusCode.NOT_FOUND).json({
        error: ResponseError.NOT_FOUND,
        message: 'User not found',
      });
    }
    logger.info(`Profile retrieved for user: ${username}`);
    return res.json(user);
  } catch (err) {
    logger.error(`Error fetching profile for ${username}: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: 'Error retrieving user profile: ' + err.message,
    });
  }
}

export async function updateUserProfile(req, res) {
  const { username, password } = req.body;
  const userId = req.user._id;
  try {
    logger.info(`Updating profile for user: ${userId}`);
    const user = await User.findById(userId);
    const userExists = await User.findOne({ username });

    if (userExists && userExists._id.toString() !== user._id.toString()) {
      logger.warn(`Username conflict for user: ${userId}`);
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.CONFLICT,
        message: 'Username already exists',
      });
    }

    user.username = username || user.username;
    if (password) {
      res.cookie('token', '', config.cookie.logout);
      user.password = password;
    }

    await user.save();
    logger.info(`Profile updated successfully for user: ${userId}`);
    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    logger.error(`Error updating profile for ${userId}: ${err.message}`, {
      error: err.stack,
    });
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: 'Error updating user profile: ' + err.message,
    });
  }
}
