const express = require('express');
const { z } = require('zod');

const router = express.Router();

const querySchema = z.object({
  query: z.string().min(1),
  w: z.coerce.number().int().min(100).max(2000).optional(),
  h: z.coerce.number().int().min(100).max(2000).optional(),
  sig: z.coerce.number().int().min(0).max(1000).optional(),
});

async function getWikiImageUrl(query) {
  const apiUrl =
    'https://en.wikipedia.org/w/api.php' +
    `?action=query&format=json&origin=*` +
    `&generator=search&gsrlimit=1&gsrsearch=${encodeURIComponent(query)}` +
    `&prop=pageimages&piprop=original`;

  const r = await fetch(apiUrl, {
    headers: { 'User-Agent': 'TourAI/1.0 (local dev)', Accept: 'application/json' },
  });
  if (!r.ok) return null;
  const data = await r.json();
  const pages = data?.query?.pages;
  if (!pages) return null;
  const first = Object.values(pages)[0];
  const url = first?.original?.source;
  return typeof url === 'string' ? url : null;
}

router.get('/unsplash', async (req, res) => {
  try {
    const { query, w = 1200, h = 800, sig = 0 } = querySchema.parse(req.query);

    const wikiUrl = await getWikiImageUrl(query);
    const picsumUrl = `https://picsum.photos/seed/${encodeURIComponent(query + ':' + sig)}/${w}/${h}`;

    async function fetchImage(url) {
      return fetch(url, {
        redirect: 'follow',
        headers: {
          'User-Agent': 'TourAI/1.0 (local dev)',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        },
      });
    }

    let r = null;
    if (wikiUrl) {
      try {
        r = await fetchImage(wikiUrl);
      } catch {
        r = null;
      }
    }
    if (!r || !r.ok) {
      r = await fetchImage(picsumUrl);
    }

    if (!r.ok) return res.status(502).json({ message: 'Image provider failed' });

    const contentType = r.headers.get('content-type') || 'image/jpeg';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const buf = Buffer.from(await r.arrayBuffer());
    res.status(200).end(buf);
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ message: 'Invalid data', issues: err.issues });
    }
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;