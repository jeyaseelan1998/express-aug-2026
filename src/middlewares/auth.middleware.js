const User = require('../models/user.model');
const ApiError = require('../utils/api-error');
const { verifyToken } = require('../utils/jwt');
const { COOKIE_NAMES } = require('../utils/auth-cookie');

function extractToken(req, scope) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }
  return req.cookies?.[COOKIE_NAMES[scope]] || null;
}

/**
 * Requires a signed-in user for the given scope, reading the token from an
 * Authorization: Bearer header or that scope's httpOnly cookie.
 *
 * The scope claim matters: web and cms tokens are signed with the same secret
 * and carry the same shape, so without it an ordinary web login could be
 * replayed against CMS routes. CMS tokens are only minted after cmsSignin has
 * checked the admin role, which is why authentication alone is enough here.
 */
function requireAuth(scope = 'web') {
  return async function authenticate(req, res, next) {
    try {
      const token = extractToken(req, scope);
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

      req.user = user;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requireAuth;
