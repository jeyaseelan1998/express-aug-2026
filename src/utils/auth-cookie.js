const COOKIE_NAMES = {
  web: 'web_token',
  cms: 'cms_token',
};

/**
 * True when the browser calling this API is served from a different site --
 * the deployed frontends are, the local dev server (another localhost port)
 * is not. A browser refuses to store or send a SameSite=Lax cookie on a
 * cross-site request, so those deployments need SameSite=None instead.
 *
 * Defaults to on in production and off everywhere else; set
 * COOKIE_CROSS_SITE explicitly to override, e.g. for a same-domain deploy.
 */
function isCrossSite() {
  if (process.env.COOKIE_CROSS_SITE !== undefined) {
    return process.env.COOKIE_CROSS_SITE === 'true';
  }
  return process.env.NODE_ENV === 'production';
}

// clearCookie only matches a cookie whose attributes line up with the ones it
// was set with, so both paths share this.
function cookieOptions() {
  const crossSite = isCrossSite();

  return {
    httpOnly: true,
    // SameSite=None is ignored unless the cookie is also Secure, so the two
    // have to move together -- a None cookie without Secure is dropped.
    secure: crossSite || process.env.NODE_ENV === 'production',
    sameSite: crossSite ? 'none' : 'lax',
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
