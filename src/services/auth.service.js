const User = require('../models/user.model');
const Role = require('../models/role.model');
const ApiError = require('../utils/api-error');
const { signToken } = require('../utils/jwt');

async function signup({ name, email, password }) {
  const existing = await User.findOne({ email });
  if (existing) {
    throw new ApiError(409, 'Email is already registered');
  }

  const userRole = await Role.findOne({ name: 'user' });
  const user = await User.create({ name, email, password, role: userRole._id });
  await user.populate('role');
  const token = signToken({ sub: user.id, scope: 'web' });

  return { user, token };
}

async function authenticate({ email, password }) {
  const user = await User.findOne({ email }).select('+password').populate('role');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  return user;
}

async function signin({ email, password }) {
  const user = await authenticate({ email, password });
  const token = signToken({ sub: user.id, scope: 'web' });

  return { user, token };
}

const CMS_ROLES = ['admin', 'superadmin'];

async function cmsSignin({ email, password }) {
  const user = await authenticate({ email, password });

  if (!CMS_ROLES.includes(user.role.name)) {
    throw new ApiError(403, 'Admin access required');
  }

  // Minted only after the role check, and scoped so it cannot be confused
  // with a web token.
  const token = signToken({ sub: user.id, scope: 'cms' });

  return { user, token };
}

module.exports = { signup, signin, cmsSignin };
