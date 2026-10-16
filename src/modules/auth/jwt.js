const jwt = require('jsonwebtoken');

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/** When the token stops working, as a unix timestamp in seconds. */
function tokenExpiresAt(token) {
  return jwt.decode(token).exp;
}

module.exports = { signToken, verifyToken, tokenExpiresAt };
