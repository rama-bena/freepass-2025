import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '15m' });
};

export async function registerUser(req, res) {
  const { username, email, password, role } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(409)
        .json({ error: 'CONFLICT', message: 'User already exists' });
    }

    const user = new User({ username, password, email, role });
    await user.save();
    return res.status(201).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'INTERNAL_SERVICE_ERROR',
      message: 'register not success: ' + err.message,
    });
  }
}

export async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password))) {
      return res.status(400).json({
        error: 'INVALID',
        message: 'email or password wrong',
      });
    }

    const token = generateToken(user._id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Hanya digunakan di HTTPS
      sameSite: 'Strict', // Cegah pengiriman cookie lintas situs
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    return res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    return res.status(500).json({
      error: 'LOGIN_FAILED',
      message: 'login not success: ' + err.message,
    });
  }
}

export async function logoutUser(req, res) {
  res.cookie('token', '', { maxAge: 1 });
  return res.json({ message: 'User logged out successfully' });
}

export const getUsers = async (req, res) => {
  try {
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_SECRET);
    const adminUser = await User.findById(decoded.id);
    if (adminUser.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'ADMIN_ONLY', message: 'Forbidden: Admins only' });
    }

    const users = await User.find({});
    const usersWithoutPassword = users.map((user) => {
      // eslint-disable-next-line no-unused-vars
      const { password, ...userWithoutPassword } = user.toObject();
      return userWithoutPassword;
    });
    return res.json(usersWithoutPassword);
  } catch (err) {
    return res
      .status(500)
      .json({ error: 'INTERNAL_SERVICE_ERROR', message: err.message });
  }
};
