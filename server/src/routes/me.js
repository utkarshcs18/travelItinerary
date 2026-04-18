const express = require('express');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  const user = await User.findById(req.user.id).select('_id email name avatarUrl createdAt');
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json({ user });
});

const updateSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  avatarUrl: z.string().url().optional(),
});

router.put('/', authMiddleware, async (req, res) => {
  try {
    const input = updateSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: input },
      { new: true, runValidators: true }
    ).select('_id email name avatarUrl createdAt');
    res.json({ user });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', issues: err.issues });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;