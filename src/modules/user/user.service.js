const createCrudService = require('../../core/crud/crud.service');
const { endAllSessions, presenceOf } = require('../auth/activity');
const Role = require('../auth/role.model');
const User = require('../auth/user.model');
const loginHistory = require('../login-history/login-history.service');

// Passwords are hashed by the model's save hook and never leave it
// (select: false + hidden in toJSON), so they are safe to accept here.
// lastLoginAt/lastSeenAt are left out of `fields`: only auth activity sets them.
const crud = createCrudService(User, {
  fields: ['name', 'email', 'password', 'role'],
  populate: ['role'],
  refs: { role: Role },
  serialize: (doc) => ({ ...doc.toJSON(), status: presenceOf(doc) }),
});

/** Accounts created without a role get `user`, the same as a web signup. */
async function create(payload) {
  if (payload.role === undefined) {
    const userRole = await Role.findOne({ name: 'user' });
    payload = { ...payload, role: userRole?._id };
  }
  return crud.create(payload);
}

/** A purged account takes its login history with it. */
async function hardDelete(id) {
  await crud.hardDelete(id);
  await loginHistory.deleteForUser(id);
}

/** Sign-in attempts for one account, newest first. Works for deleted accounts too. */
async function getLoginHistory(id, query) {
  await crud.findOrFail(id, { withDeleted: true });
  return loginHistory.listForUser(id, query);
}

/** Signs the user out everywhere: website and CMS, on every device. */
async function logout(id) {
  await crud.findOrFail(id);
  await endAllSessions(id);
  return crud.getById(id);
}

module.exports = { ...crud, create, hardDelete, getLoginHistory, logout };
