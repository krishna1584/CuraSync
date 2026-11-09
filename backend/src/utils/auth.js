const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');

const DEFAULT_TOKEN_TTL = '7d';

// Placeholder values from docs/examples that must never be used as a real secret.
const PLACEHOLDER_SECRETS = [
  'your-secret-key',
  'your-super-secret-jwt-key-here-change-this-in-production',
  'your-super-secret-jwt-key-change-this-in-production',
  'generate-a-secure-random-string'
];

// Fail fast: never sign or verify tokens with a missing or placeholder secret.
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || PLACEHOLDER_SECRETS.includes(secret)) {
    throw new Error('JWT_SECRET is missing or still set to a placeholder value');
  }
  return secret;
};

const tokenTtl = () => process.env.JWT_EXPIRE || DEFAULT_TOKEN_TTL;

// Convert a jsonwebtoken-style duration ("7d", "12h", "30m", "3600") to milliseconds.
const ttlToMs = (ttl) => {
  const match = /^(\d+)\s*([smhd]?)$/.exec(String(ttl).trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = { '': 1000, s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return value * unit;
};

const generateToken = (id) => {
  return jwt.sign({ id }, getJwtSecret(), { expiresIn: tokenTtl() });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Cookie options shared by login (set) and logout (clear) so they always match.
const authCookieOptions = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    maxAge: ttlToMs(tokenTtl())
  };
};

const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString('hex');
};

const hashPassword = async (password) => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

module.exports = {
  getJwtSecret,
  generateToken,
  verifyToken,
  authCookieOptions,
  generateOTP,
  generateRandomString,
  hashPassword,
  comparePassword
};
