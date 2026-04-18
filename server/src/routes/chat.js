const express = require('express');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');
const { generateChatReply } = require('../services/geminiChat');

const router = express.Router();

const messageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(4000),
});

const chatSchema = z.object({
  messages: z.array(messageSchema).min(1).max(20),
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { messages } = chatSchema.parse(req.body);
    const reply = await generateChatReply(messages);
    res.json({ reply });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', issues: err.issues });
    }
    const msg = String(err?.message || '');
    if (msg.includes('503') || msg.includes('Service Unavailable') || msg.includes('high demand')) {
      return res.status(503).json({
        message: 'AI is under high demand right now. Please try again in a few seconds.',
      });
    }
    console.error(err);
    res.status(500).json({ message: err?.message || 'Internal server error' });
  }
});

module.exports = router;