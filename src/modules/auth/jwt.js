const jwt = require('jsonwebtoken');

// No sign-in lasts longer than this. SESSION_HOURS may shorten it, never
// lengthen it.
const MAX_SESSION_SECONDS = 4 * 60 * 60;

function sessionSeconds() {
  const hours = Number(process.env.SESSION_HOURS);
  return hours > 0 ? Math.min(hours * 60 * 60, MAX_SESSION_SECONDS) : MAX_SESSION_SECONDS;
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: sessionSeconds() });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/** When the token stops working, as a unix timestamp in seconds. */
function tokenExpiresAt(token) {
  return jwt.decode(token).exp;
}

module.exports = { signToken, verifyToken, tokenExpiresAt, sessionSeconds, MAX_SESSION_SECONDS };
