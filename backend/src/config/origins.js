// Single list of browser origins allowed to call the API and open sockets.
// Add extra origins (e.g. a specific Vercel preview URL) with a comma-separated
// ALLOWED_ORIGINS env var. Wildcards are intentionally not supported.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://curasync1.vercel.app',
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGINS || '').split(',')
]
  .map((origin) => (origin || '').trim().replace(/\/+$/, ''))
  .filter(Boolean);

const isAllowedOrigin = (origin) => allowedOrigins.includes(origin);

module.exports = { allowedOrigins, isAllowedOrigin };
