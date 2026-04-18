const pino = require('pino');
const pinoHttp = require('pino-http');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      'req.cookies.refreshToken',
      'res.headers["set-cookie"]',
    ],
    remove: true,
  },
});

const httpLogger = pinoHttp({
  logger,
  customProps: (req) => ({
    requestId: req.id,
  }),
});

module.exports = { logger, httpLogger };