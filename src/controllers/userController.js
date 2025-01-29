import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { Role, HttpStatusCode, ResponseError } from '../utils/types.js';
import config from '../config/config.js';

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

export async function registerUser(req, res) {
  const { username, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(HttpStatusCode.CONFLICT).json({
        error: ResponseError.CONFLICT,
        message: 'User already exists',
      });
    }

    const user = new User({ username, password, email, role });
    await user.save();
    return res.status(HttpStatusCode.CREATED).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: 'Register not successful: ' + err.message,
    });
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(HttpStatusCode.BAD_REQUEST).json({
        error: ResponseError.INVALID,
        message: 'Email or password wrong',
      });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, config.cookie.login);

    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.LOGIN_FAILED,
      message: 'Login not successful: ' + err.message,
    });
  }
}

export async function logoutUser(req, res) {
  res.cookie('token', '', config.cookie.logout);
  return res.json({ message: 'User logged out successfully' });
}

export const getUsers = async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.token, config.jwt.secret);
    const adminUser = await User.findById(decoded.id);
    if (adminUser.role !== Role.ADMIN) {
      return res.status(HttpStatusCode.FORBIDDEN).json({
        error: ResponseError.ADMIN_ONLY,
        message: 'Forbidden: Admins only',
      });
    }

    const users = await User.find({}).select('-password');
    return res.json(users);
  } catch (err) {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: err.message,
    });
  }
};

export async function getUserProfile(req, res) {
  const { username } = req.params;
  try {
    const user = await User.findOne({ username }).select('-password');
    if (!user) {
      return res.status(HttpStatusCode.NOT_FOUND).json({
        error: ResponseError.NOT_FOUND,
        message: 'User not found',
      });
    }
    return res.json(user);
  } catch (err) {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: 'Error retrieving user profile: ' + err.message,
    });
  }
}

export async function updateUserProfile(req, res) {
  const { username, password } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const userExists = await User.findOne({ username });

    if (userExists && userExists._id.toString() !== user._id.toString()) {
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
    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: 'Error updating user profile: ' + err.message,
    });
  }
}
