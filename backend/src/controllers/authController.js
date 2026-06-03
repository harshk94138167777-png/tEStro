import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import validator from 'validator';
import { User } from '../models/User.js';
import { logAction } from '../services/testStore.js';

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required' });
    }
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!validator.isLength(password, { min: 8, max: 128 })) {
      return res.status(400).json({ error: 'Password must be 8–128 characters' });
    }
    const exists = await User.findOne({ email: validator.normalizeEmail(email) });
    if (exists) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: validator.escape(name.trim()),
      email: validator.normalizeEmail(email),
      passwordHash,
      role: 'free',
    });
    await logAction(user._id, 'register', { email: user.email }, req.ip);
    const token = signToken(user);
    res.status(201).json({ token, user: user.toSafeObject() });
  } catch (e) {
    next(e);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }
    const user = await User.findOne({ email: validator.normalizeEmail(email) }).select('+passwordHash');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    await logAction(user._id, 'login', {}, req.ip);
    const token = signToken(user);
    res.json({ token, user: user.toSafeObject() });
  } catch (e) {
    next(e);
  }
}

export async function me(req, res, next) {
  try {
    res.json({ user: req.user.toSafeObject() });
  } catch (e) {
    next(e);
  }
}
