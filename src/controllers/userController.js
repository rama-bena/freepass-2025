import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';
import { HttpStatusCode, ResponseError } from '../utils/types.js';
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
    if (adminUser.role !== 'admin') {
      return res.status(HttpStatusCode.FORBIDDEN).json({
        error: ResponseError.ADMIN_ONLY,
        message: 'Forbidden: Admins only',
      });
    }

    const users = await User.find({});
    const usersWithoutPassword = users.map((user) => {
      // eslint-disable-next-line no-unused-vars
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    });
    return res.json(usersWithoutPassword);
  } catch (err) {
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json({
      error: ResponseError.INTERNAL_SERVER_ERROR,
      message: err.message,
    });
  }
};
