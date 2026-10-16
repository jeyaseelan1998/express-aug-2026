const User = require('./user.model');
const Role = require('./role.model');
const ApiError = require('../../core/api-error');
const loginHistory = require('../login-history/login-history.service');
const { markSignedIn, markSignedOut } = require('./activity');
const { signToken, verifyToken } = require('./jwt');

const CMS_ROLES = ['admin', 'superadmin'];

/**
 * Starts a session: records the login, stamps the account's activity and mints
 * a token scoped so a web token cannot be replayed against the CMS.
 * `context` carries the caller's { ip, userAgent } for the login history.
 */
function startSession(user, scope, context) {
  loginHistory.record({ user: user._id, scope, success: true, ...context });
  markSignedIn(user);
  return { user, token: signToken({ sub: user.id, scope }) };
}

async function signup({ name, email, password }, context = {}) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email is already registered');
  }

  const userRole = await Role.findOne({ name: 'user' });
  const user = await User.create({ name, email, password, role: userRole._id });
  await user.populate('role');

  return startSession(user, 'web', context);
}

/**
 * Failed attempts are logged against the account they targeted. Unknown
 * emails are not: there is no account to attach them to.
 */
async function authenticate({ email, password }, scope, context) {
  const user = await User.findOne({ email }).select('+password').populate('role');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!(await user.comparePassword(password))) {
    loginHistory.record({
      user: user._id,
      scope,
      success: false,
      reason: 'invalid_password',
      ...context,
    });
    throw new ApiError(401, 'Invalid email or password');
  }
  return user;
}

async function signin(credentials, context = {}) {
  const user = await authenticate(credentials, 'web', context);
  return startSession(user, 'web', context);
}

async function cmsSignin(credentials, context = {}) {
  const user = await authenticate(credentials, 'cms', context);

  // The token is minted only after the role check.
  if (!CMS_ROLES.includes(user.role.name)) {
    loginHistory.record({
      user: user._id,
      scope: 'cms',
      success: false,
      reason: 'not_admin',
      ...context,
    });
    throw new ApiError(403, 'Admin access required');
  }

  return startSession(user, 'cms', context);
}

/**
 * Marks the account offline. Tokens are stateless, so this is best effort: a
 * missing, invalid or other-scope token is simply ignored.
 */
function signout(token, scope) {
  if (!token) return;
  try {
    const payload = verifyToken(token);
    if (payload.scope === scope) markSignedOut(payload.sub);
  } catch {
    // Expired or tampered: nothing to mark.
  }
}

module.exports = { signup, signin, cmsSignin, signout };
