const COOKIE_NAMES = {
  web: 'web_token',
  cms: 'cms_token',
};

// clearCookie only matches a cookie whose attributes line up with the ones it
// was set with, so both paths share this.
function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  };
}

function cookieNameFor(scope) {
  const cookieName = COOKIE_NAMES[scope];
  if (!cookieName) {
    throw new Error(`Unknown auth cookie scope: ${scope}`);
  }
  return cookieName;
}

function setAuthCookie(res, token, scope = 'web') {
  res.cookie(cookieNameFor(scope), token, {
    ...cookieOptions(),
    maxAge: Number(process.env.COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000,
  });
}

function clearAuthCookie(res, scope = 'web') {
  res.clearCookie(cookieNameFor(scope), cookieOptions());
}

function isWebClient(req) {
  return (req.headers['x-client-type'] || '').toLowerCase() === 'web';
}

module.exports = { COOKIE_NAMES, setAuthCookie, clearAuthCookie, isWebClient };
