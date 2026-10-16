const User = require('./user.model');
const ApiError = require('../../core/api-error');
const { verifyToken } = require('./jwt');
const { touchLastSeen } = require('./activity');

/** The token from an `Authorization: Bearer <token>` header, or null. */
function extractToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() || null : null;
}

/**
 * Requires a signed-in user for the given scope, reading the token from the
 * `Authorization: Bearer` header. Clients store the token themselves.
 *
 * The scope claim matters: web and cms tokens are signed with the same secret
 * and carry the same shape, so without it an ordinary web login could be
 * replayed against CMS routes. CMS tokens are only minted after cmsSignin has
 * checked the admin role, which is why authentication alone is enough here.
 */
function requireAuth(scope = 'web') {
  return async function authenticate(req, res, next) {
    try {
      const token = extractToken(req);
      if (!token) {
        throw new ApiError(401, 'Authentication required');
      }

      let payload;
      try {
        payload = verifyToken(token);
      } catch {
        throw new ApiError(401, 'Invalid or expired token');
      }

      if (payload.scope !== scope) {
        throw new ApiError(403, `This endpoint requires a ${scope} session`);
      }

      const user = await User.findById(payload.sub).populate('role');
      if (!user) {
        throw new ApiError(401, 'Account no longer exists');
      }

      // Tokens minted before sessionVersion existed carry no `sv`: they count
      // as version 0, so introducing it signed nobody out.
      if ((payload.sv ?? 0) !== (user.sessionVersion ?? 0)) {
        throw new ApiError(401, 'Your session has ended. Please sign in again.');
      }

      touchLastSeen(user);
      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requireAuth;
module.exports.extractToken = extractToken;
