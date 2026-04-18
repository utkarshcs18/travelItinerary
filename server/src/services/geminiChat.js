const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

function getGeminiClient() {
  const key = process.env.GOOGLE_GEMINI_API_KEY;
  if (!key) throw new Error('Missing GOOGLE_GEMINI_API_KEY');
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

async function generateChatReply(messages) {
  const genAI = getGeminiClient();
  const configured = process.env.GEMINI_MODEL;
  const candidates = [
    configured,
    'gemini-flash-latest',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
  ].filter(Boolean);

  const system = `You are TourAI.

Your job:
- Friendly chitchat (small talk) AND practical help (travel planning + app support).
- Match the user's tone. Be warm, natural, and helpful.

Travel help:
- Ask at most one clarifying question when needed.
- If the user wants a full itinerary, encourage using the Planner form, but still give helpful guidance and a short draft plan.

App support:
- You are inside a travel itinerary web app (React + Express + MongoDB).
- You can help troubleshoot errors, explain how to use features, and provide step-by-step checks.
- When user reports a bug, ask for the exact error text and where it appears (page + action) if missing.
- Provide actionable steps (what to click, what to restart, what to check in server/.env).

Constraints:
- Keep answers concise (usually 3-8 short lines).
- No medical/legal/financial advice beyond general travel tips.
- If asked for unsafe/illegal things, refuse briefly and offer safe alternatives.`;

  const transcript = messages
    .map((m) => `${m.role === 'assistant' ? 'Assistant' : 'User'}: ${m.content}`)
    .join('\n');

  const prompt = `${system}\n\nConversation:\n${transcript}\nAssistant:`;

  let lastErr = null;
  for (const modelName of candidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const result = await model.generateContent(prompt);
          const text = result.response.text();
          return text.trim();
        } catch (err) {
          lastErr = err;
          if (isModelNotFoundError(err)) throw err;
          if (!isRetryableGeminiError(err) || attempt === 3) throw err;
          const base = 350 * Math.pow(2, attempt);
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

module.exports = { generateChatReply };