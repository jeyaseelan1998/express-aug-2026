const ApiError = require('../utils/api-error');

// Trailing slashes never appear in a browser's Origin header, so strip them
// from configured values to keep `https://foo.com/` and `https://foo.com` equal.
function normalize(origin) {
  return origin.trim().replace(/\/+$/, '');
}

function getAllowedOrigins() {
  return (process.env.CORS_ORIGINS || '').split(',').map(normalize).filter(Boolean);
}

function isOriginAllowed(origin) {
  const allowed = getAllowedOrigins();
  return allowed.includes('*') || allowed.includes(normalize(origin));
}

const corsOptions = {
  origin(origin, callback) {
    // No Origin header: same-origin requests and non-browser clients
    // (curl, Postman, server-to-server), which CORS does not govern.
    if (!origin) {
      return callback(null, true);
    }
    if (isOriginAllowed(origin)) {
      // Reflect the caller's origin rather than '*', which browsers reject
      // on credentialed requests — auth here rides on cookies.
      return callback(null, true);
    }
    return callback(new ApiError(403, `Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-type'],
  maxAge: 86400,
};

function assertConfigured() {
  if (!getAllowedOrigins().length) {
    throw new Error('CORS_ORIGINS is not set');
  }
}

module.exports = { corsOptions, getAllowedOrigins, isOriginAllowed, assertConfigured };
