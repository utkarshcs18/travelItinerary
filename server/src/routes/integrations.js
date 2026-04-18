const express = require('express');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/weather', authMiddleware, async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ message: 'lat and lon query params are required' });
  }

  const url =
    'https://api.open-meteo.com/v1/forecast' +
    `?latitude=${encodeURIComponent(lat)}` +
    `&longitude=${encodeURIComponent(lon)}` +
    '&current=temperature_2m,weather_code,wind_speed_10m' +
    '&timezone=auto';

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ message: 'Weather provider failed' });
    const data = await r.json();
    res.json({
      provider: 'open-meteo',
      current: data.current,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/geocode', authMiddleware, async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.status(400).json({ message: 'q query param is required' });

  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?q=${encodeURIComponent(q)}` +
    '&format=json&limit=1';

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'TourAI/1.0 (local dev)',
        Accept: 'application/json',
      },
    });
    if (!r.ok) return res.status(502).json({ message: 'Geocoding provider failed' });
    const data = await r.json();
    const first = data?.[0];
    if (!first) return res.status(404).json({ message: 'No results' });
    res.json({
      provider: 'nominatim',
      place: {
        displayName: first.display_name,
        lat: Number(first.lat),
        lon: Number(first.lon),
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/reverse-geocode', authMiddleware, async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ message: 'lat and lon query params are required' });
  }

  const url =
    'https://nominatim.openstreetmap.org/reverse' +
    `?lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lon)}` +
    '&format=json';

  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'TourAI/1.0 (local dev)',
        Accept: 'application/json',
      },
    });
    if (!r.ok) return res.status(502).json({ message: 'Reverse geocoding provider failed' });
    const data = await r.json();
    const addr = data?.address || {};
    res.json({
      provider: 'nominatim',
      place: {
        displayName: data?.display_name,
        city: addr.city || addr.town || addr.village || addr.county || null,
        state: addr.state || null,
        country: addr.country || null,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/maps/places', authMiddleware, async (_req, res) => {
  res.json({
    provider: 'stub',
    message: 'Google Maps/Places integration not configured yet.',
  });
});

router.get('/flights', authMiddleware, async (_req, res) => {
  res.json({
    provider: 'stub',
    message: 'Flights integration not configured yet.',
  });
});

router.get('/hotels', authMiddleware, async (_req, res) => {
  res.json({
    provider: 'stub',
    message: 'Hotels integration not configured yet.',
  });
});

module.exports = router;