const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiClient() {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) {
    throw new Error('Missing GOOGLE_GEMINI_API_KEY');
  }
  return new GoogleGenerativeAI(key);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableGeminiError(err) {
  const msg = String(err?.message || '');
  return (
    msg.includes('503') ||
    msg.includes('Service Unavailable') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('Too Many Requests') ||
    msg.includes('timeout') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ENOTFOUND') ||
    msg.includes('fetch failed')
  );
}

function isModelNotFoundError(err) {
  const msg = String(err?.message || '');
  return msg.includes('404') || msg.includes('not found') || msg.includes('not supported');
}

async function generateItineraryJSON({
  destination,
  startDate,
  endDate,
  travelMode,
  budget,
  members,
  preferencesText,
}) {
  const genAI = getGeminiClient();
  const configured = process.env.GEMINI_MODEL;
  const candidates = [
    configured,
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ].filter(Boolean);

  const schemaHint = {
    summary: 'string',
    days: [
      {
        date: 'YYYY-MM-DD',
        morning: 'string',
        afternoon: 'string',
        evening: 'string',
        food: ['string'],
        notes: ['string'],
        estimatedCost: 'number',
      },
    ],
    packingList: ['string'],
    localTips: ['string'],
    budgetBreakdown: {
      stay: 'number',
      food: 'number',
      activities: 'number',
      transport: 'number',
      buffer: 'number',
    },
  };

  const prompt = `
You are an expert travel planner.
Return ONLY valid JSON. No markdown, no commentary.

Trip inputs:
- destination: ${destination}
- startDate: ${startDate}
- endDate: ${endDate}
- travelMode: ${travelMode}
- budget: ${budget}
- members: ${members}
- preferences: ${preferencesText || ''}

Output JSON must match this shape (keys required):
${JSON.stringify(schemaHint, null, 2)}

Rules:
- Provide a realistic, day-by-day plan.
- Keep costs within budget. Include budget breakdown.
- Include local tips and a packing list.
`;

  let lastErr = null;
  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          return { modelName, text };
        } catch (err) {
          lastErr = err;
          if (isModelNotFoundError(err)) throw err;
          if (!isRetryableGeminiError(err) || attempt === 3) throw err;
          const base = 500 * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * 150);
          await sleep(base + jitter);
        }
      }
    } catch (err) {
      lastErr = err;
      if (isModelNotFoundError(err)) continue;
      throw err;
    }
  }
  throw lastErr || new Error('Gemini request failed');
}

module.exports = { generateItineraryJSON };