const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const ACCESS_TTL = '15m';
const REFRESH_TTL_DAYS = 7;

function signAccessToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

function signRefreshToken() {
  return crypto.randomBytes(64).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getRefreshExpiryDate() {
  const expires = new Date();
  expires.setDate(expires.getDate() + REFRESH_TTL_DAYS);
  return expires;
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  hashToken,
  getRefreshExpiryDate,
};