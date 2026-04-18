const express = require('express');
const bcrypt = require('bcrypt');
const { z } = require('zod');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const {
  signAccessToken,
  signRefreshToken,
  hashToken,
  getRefreshExpiryDate,
} = require('../utils/tokens');

const router = express.Router();
const { authLimiter } = require('../middleware/rateLimit');

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).optional(),
});

function setRefreshCookie(res, refreshToken) {
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/auth',
  });
}

router.post('/signup', async (req, res) => {
  try {
    const parsed = authSchema.parse(req.body);
    const existing = await User.findOne({ email: parsed.email });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(parsed.password, 10);
    const user = await User.create({
      email: parsed.email,
      passwordHash,
      name: parsed.name,
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: getRefreshExpiryDate(),
    });

    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      accessToken,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', issues: err.issues });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const parsed = authSchema.parse(req.body);
    const user = await User.findOne({ email: parsed.email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(parsed.password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken();
    const tokenHash = hashToken(refreshToken);

    await RefreshToken.create({
      userId: user._id,
      tokenHash,
      expiresAt: getRefreshExpiryDate(),
    });

    setRefreshCookie(res, refreshToken);

    res.json({
      accessToken,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', issues: err.issues });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ message: 'Missing refresh token' });
    }

    const tokenHash = hashToken(refreshToken);
    const record = await RefreshToken.findOne({ tokenHash });
    if (!record || record.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    const user = await User.findById(record.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await RefreshToken.deleteOne({ tokenHash });
    }
    res.clearCookie('refreshToken', { path: '/auth' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;