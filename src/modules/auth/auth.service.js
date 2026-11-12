const User = require('./user.model');
const Role = require('./role.model');
const ApiError = require('../../core/api-error');
const loginHistory = require('../login-history/login-history.service');
const { verifyToken } = require('./jwt');
const { startSession, signOutSession } = require('./sessions');

const CMS_ROLES = ['admin', 'superadmin'];

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
    loginHistory.recordFailure({
      user: user._id,
      scope,
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
    loginHistory.recordFailure({
      user: user._id,
      scope: 'cms',
      reason: 'not_admin',
      ...context,
    });
    throw new ApiError(403, 'Admin access required');
  }

  return startSession(user, 'cms', context);
}

/**
 * Ends the caller's own session and marks them offline. Best effort: a
 * missing, invalid or other-scope token is simply ignored.
 */
function signout(token, scope) {
  if (!token) return;
  try {
    const payload = verifyToken(token);
    if (payload.scope === scope) signOutSession(payload.sub, payload.sid);
  } catch {
    // Expired or tampered: nothing to mark.
  }
}

module.exports = { signup, signin, cmsSignin, signout };
