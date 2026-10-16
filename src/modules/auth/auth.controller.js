const asyncHandler = require('../../core/async-handler');
const authService = require('./auth.service');
const { setAuthCookie, clearAuthCookie, isWebClient } = require('./auth-cookie');
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
  const { user, token } = await authService.signup({ name, email, password }, requestContext(req));
  res.status(201).json({ user, token });
});

/**
 * Browser clients (`X-Client-Type: web`) get the token as an httpOnly cookie;
 * everyone else gets it in the body.
 */
function signin(scope) {
  return asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await SIGNIN_BY_SCOPE[scope]({ email, password }, requestContext(req));

    if (isWebClient(req)) {
      setAuthCookie(res, token, scope);
      return res.status(200).json({ user });
    }

    res.status(200).json({ user, token });
  });
}

// requireAuth has already resolved and populated the account behind the token,
// so there is nothing left to look up here.
function profile(req, res) {
  res.status(200).json({ user: req.user });
}

// Tokens are stateless, so all the server can do is drop the cookie it set.
// Bearer clients simply discard the token themselves; either way the call
// succeeds so a client with an already-expired session can still clean up.
function signout(scope) {
  return function handleSignout(req, res) {
    authService.signout(extractToken(req, scope), scope);
    clearAuthCookie(res, scope);
    res.status(200).json({ message: 'Signed out' });
  };
}

module.exports = { signup, signin, profile, signout };
