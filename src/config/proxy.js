/**
 * Express `trust proxy` setting, from TRUST_PROXY. It decides when the
 * X-Forwarded-For header is believed, and so what `req.ip` is -- the address
 * the login history records.
 *
 * The default, `loopback`, trusts only a proxy on the same machine (Nginx,
 * Caddy, a PM2 setup): behind one, every request otherwise looks like it comes
 * from ::1. It is safe without a proxy too, since a remote client never
 * connects from loopback and so cannot spoof its IP through the header.
 *
 * Other values: a hop count (`1` behind a platform load balancer such as
 * Render/Railway/Heroku), a list of addresses/subnets, `true` (trust anything
 * -- only if the app is unreachable except through the proxy), or `false`.
 */
function getTrustProxy() {
  const value = (process.env.TRUST_PROXY || 'loopback').trim();

  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^\d+$/.test(value)) return Number(value);
  return value;
}

module.exports = { getTrustProxy };
