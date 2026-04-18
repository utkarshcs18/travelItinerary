const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const itinerariesRoutes = require('./routes/itineraries');
const integrationsRoutes = require('./routes/integrations');
const meRoutes = require('./routes/me');
const recommendationsRoutes = require('./routes/recommendations');
const imagesRoutes = require('./routes/images');
const chatRoutes = require('./routes/chat');
const { httpLogger } = require('./utils/logger');
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();

const PORT = process.env.PORT || 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/travel_itinerary';

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(httpLogger);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const envOrigins = CLIENT_ORIGIN.split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const isLocalhost =
        /^http:\/\/localhost:\d+$/.test(origin) || /^http:\/\/127\.0\.0\.1:\d+$/.test(origin);

      if (isLocalhost || envOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(apiLimiter);
app.use(express.json());
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/me', meRoutes);
app.use('/itineraries', itinerariesRoutes);
app.use('/integrations', integrationsRoutes);
app.use('/recommendations', recommendationsRoutes);
app.use('/images', imagesRoutes);
app.use('/chat', chatRoutes);

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`API server listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });