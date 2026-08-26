const COOKIE_NAMES = {
  web: 'web_token',
  cms: 'cms_token',
};

function setAuthCookie(res, token, scope = 'web') {
  const cookieName = COOKIE_NAMES[scope];
  if (!cookieName) {
    throw new Error(`Unknown auth cookie scope: ${scope}`);
  }

  res.cookie(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Number(process.env.COOKIE_MAX_AGE_MS) || 24 * 60 * 60 * 1000,
  });
}

function isWebClient(req) {
  return (req.headers['x-client-type'] || '').toLowerCase() === 'web';
}

module.exports = { COOKIE_NAMES, setAuthCookie, isWebClient };
