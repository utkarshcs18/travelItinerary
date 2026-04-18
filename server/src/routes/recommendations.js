const express = require('express');
const { z } = require('zod');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const querySchema = z.object({
  lat: z.coerce.number(),
  lon: z.coerce.number(),
});

function imgUrl(query) {
  return { query, w: 1200, h: 800 };
}

router.get('/', authMiddleware, async (req, res) => {
  const { lat, lon } = querySchema.parse(req.query);

  // Fetch current weather to choose suggestions.
  const weatherUrl =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    '&current=temperature_2m,weather_code' +
    '&timezone=auto';

  let current = null;
  try {
    const r = await fetch(weatherUrl);
    if (r.ok) current = (await r.json()).current || null;
  } catch {
    // ignore, we’ll still return fallback recs
  }

  const temp = Number(current?.temperature_2m);
  const isCold = Number.isFinite(temp) ? temp < 12 : false;
  const isHot = Number.isFinite(temp) ? temp > 28 : false;

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const proxy = ({ query, w, h }, sig = 0) =>
    `${baseUrl}/images/unsplash?query=${encodeURIComponent(query)}&w=${w}&h=${h}&sig=${sig}`;

  const picks = [
    isCold
      ? {
          id: 'cozy-cafe-city',
          title: 'Cozy café city break',
          destination: 'Paris',
          reason: 'Great museums, cafés, and indoors-friendly plan.',
          imageUrl: proxy(imgUrl('Paris city night rain cafe'), 1),
          tags: ['indoor', 'culture', 'food'],
        }
      : {
          id: 'walkable-old-town',
          title: 'Walkable old town',
          destination: 'Lisbon',
          reason: 'Perfect for scenic neighborhoods and viewpoints.',
          imageUrl: proxy(imgUrl('Lisbon old town sunset'), 2),
          tags: ['views', 'walkable', 'local'],
        },
    isHot
      ? {
          id: 'beach-reset',
          title: 'Beach reset',
          destination: 'Bali',
          reason: 'Relaxed pace, beaches, and nightlife options.',
          imageUrl: proxy(imgUrl('Bali beach palm trees'), 3),
          tags: ['beach', 'relax', 'sun'],
        }
      : {
          id: 'mountain-air',
          title: 'Mountain air',
          destination: 'Manali',
          reason: 'Fresh air, scenic routes, and cozy evenings.',
          imageUrl: proxy(imgUrl('Himalayas mountain road Manali'), 4),
          tags: ['nature', 'scenic', 'calm'],
        },
    {
      id: 'food-capital',
      title: 'Food capital sprint',
      destination: 'Bangkok',
      reason: 'Night markets + temples + budget-friendly eats.',
      imageUrl: proxy(imgUrl('Bangkok street food night market'), 5),
      tags: ['food', 'markets', 'night'],
    },
    {
      id: 'future-city',
      title: 'Future city',
      destination: 'Tokyo',
      reason: 'Efficient transit, neighborhoods, and tech culture.',
      imageUrl: proxy(imgUrl('Tokyo neon street'), 6),
      tags: ['city', 'tech', 'transit'],
    },
    {
      id: 'desert-skyline',
      title: 'Desert skyline',
      destination: 'Dubai',
      reason: 'Iconic skyline, modern attractions, and high-energy nights.',
      imageUrl: proxy(imgUrl('Dubai skyline marina'), 7),
      tags: ['skyline', 'lux', 'night'],
    },
    {
      id: 'island-history',
      title: 'Island history',
      destination: 'Santorini',
      reason: 'Cliffside views, sunsets, and relaxed pace.',
      imageUrl: proxy(imgUrl('Santorini white houses sunset'), 8),
      tags: ['views', 'relax', 'sea'],
    },
  ];

  res.json({
    weather: current,
    recommendations: picks,
  });
});

module.exports = router;