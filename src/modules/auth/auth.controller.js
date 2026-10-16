const asyncHandler = require('../../core/async-handler');
const authService = require('./auth.service');
const { extractToken } = require('./auth.middleware');

// Node reports IPv4 callers on a dual-stack socket as `::ffff:1.2.3.4`.
const normalizeIp = (ip) => (ip ? ip.replace(/^::ffff:(?=\d+\.\d+\.\d+\.\d+$)/, '') : null);

// Who signed in from where, for the login history.
const requestContext = (req) => ({
  ip: normalizeIp(req.ip),
  userAgent: req.get('user-agent') || null,
});

// Each scope has its own sign-in rules: cms additionally requires an admin role.
const SIGNIN_BY_SCOPE = {
  web: authService.signin,
  cms: authService.cmsSignin,
};

const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const session = await authService.signup({ name, email, password }, requestContext(req));
  res.status(201).json(session);
});

/**
 * Returns `{ user, token, expiresAt }`. Every client -- browser or app -- stores
 * the token itself and sends it back as `Authorization: Bearer <token>`.
 */
function signin(scope) {
  return asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const session = await SIGNIN_BY_SCOPE[scope]({ email, password }, requestContext(req));
    res.status(200).json(session);
  });
}

// requireAuth has already resolved and populated the account behind the token,
// so there is nothing left to look up here.
function profile(req, res) {
  res.status(200).json({ user: req.user });
}

// Tokens are stateless: the client deletes its own copy, and this only marks
// the account offline. Always succeeds, so a client holding an expired token
// can still sign out cleanly.
function signout(scope) {
  return function handleSignout(req, res) {
    authService.signout(extractToken(req), scope);
    res.status(200).json({ message: 'Signed out' });
  };
}

module.exports = { signup, signin, profile, signout };
