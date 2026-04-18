const express = require('express');
const { z } = require('zod');
const Itinerary = require('../models/Itinerary');
const { authMiddleware } = require('../middleware/auth');
const { generateItineraryJSON } = require('../services/gemini');

const router = express.Router();

const generateSchema = z.object({
  destination: z.string().min(2),
  startDate: z.string().min(8),
  endDate: z.string().min(8),
  travelMode: z.enum(['flight', 'train', 'car', 'bus', 'other']),
  budget: z.number().nonnegative(),
  members: z.number().int().min(1),
  preferencesText: z.string().optional(),
});

const itineraryResultSchema = z.object({
  summary: z.string(),
  days: z.array(
    z.object({
      date: z.string(),
      morning: z.string(),
      afternoon: z.string(),
      evening: z.string(),
      food: z.array(z.string()).default([]),
      notes: z.array(z.string()).default([]),
      estimatedCost: z.number().optional().default(0),
    })
  ),
  packingList: z.array(z.string()).default([]),
  localTips: z.array(z.string()).default([]),
  budgetBreakdown: z
    .object({
      stay: z.number().optional().default(0),
      food: z.number().optional().default(0),
      activities: z.number().optional().default(0),
      transport: z.number().optional().default(0),
      buffer: z.number().optional().default(0),
    })
    .default({}),
});

router.post('/generate', authMiddleware, async (req, res) => {
  try {
    const input = generateSchema.parse(req.body);
    const { modelName, text } = await generateItineraryJSON(input);

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(502).json({
        message: 'AI returned non-JSON output',
        raw: text.slice(0, 2000),
      });
    }

    const result = itineraryResultSchema.parse(parsed);

    const doc = await Itinerary.create({
      userId: req.user.id,
      destination: input.destination,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      travelMode: input.travelMode,
      budget: input.budget,
      members: input.members,
      preferencesText: input.preferencesText,
      result,
      model: modelName,
    });

    res.status(201).json({ id: doc._id, result });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', issues: err.issues });
    }
    if (String(err?.message || '').includes('Missing GOOGLE_GEMINI_API_KEY')) {
      return res.status(500).json({
        message:
          'Gemini API key is not configured on the server. Set GOOGLE_GEMINI_API_KEY in server/.env and restart the backend.',
      });
    }
    console.error(err);
    res.status(500).json({ message: err?.message || 'Internal server error' });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  const items = await Itinerary.find({ userId: req.user.id })
    .sort({ createdAt: -1 })
    .select('_id destination startDate endDate travelMode budget members createdAt');
  res.json({ items });
});

router.get('/:id', authMiddleware, async (req, res) => {
  const item = await Itinerary.findOne({ _id: req.params.id, userId: req.user.id });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ item });
});

module.exports = router;