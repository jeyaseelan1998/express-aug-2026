const ApiError = require('../../core/api-error');
const createCrudService = require('../../core/crud/crud.service');
const { presenceOf } = require('../auth/activity');
const Role = require('../auth/role.model');
const { endAllSessions, endSession } = require('../auth/sessions');
const User = require('../auth/user.model');
const loginHistory = require('../login-history/login-history.service');

// Passwords are hashed by the model's save hook and never leave it
// (select: false + hidden in toJSON), so they are safe to accept here.
// lastLoginAt/lastSeenAt are left out of `fields`: only auth activity sets them.
const crud = createCrudService(User, {
  fields: ['name', 'email', 'password', 'role'],
  populate: ['role'],
  refs: { role: Role },
});

/**
 * Adds `activeSessions` (signed-in devices) to each user, counted for the
 * whole batch in one query. Without an active session a user is offline,
 * however recently they were seen.
 */
async function withSessions(users) {
  const counts = await loginHistory.countActive(users.map((user) => user.id));
  return users.map((user) => {
    const activeSessions = counts.get(String(user.id)) ?? 0;
    return { ...user, activeSessions, status: activeSessions ? presenceOf(user) : 'offline' };
  });
}

const withSession = async (user) => (await withSessions([user]))[0];

async function list(query, options) {
  const result = await crud.list(query, options);
  return { ...result, items: await withSessions(result.items) };
}

/** Accounts created without a role get `user`, the same as a web signup. */
async function create(payload) {
  if (payload.role === undefined) {
    const userRole = await Role.findOne({ name: 'user' });
    payload = { ...payload, role: userRole?._id };
  }
  return withSession(await crud.create(payload));
}

const getById = async (id) => withSession(await crud.getById(id));
const update = async (id, payload) => withSession(await crud.update(id, payload));
const remove = async (id) => withSession(await crud.remove(id));
const restore = async (id) => withSession(await crud.restore(id));

/** A purged account takes its login history with it. */
async function hardDelete(id) {
  await crud.hardDelete(id);
  await loginHistory.deleteForUser(id);
}

/**
 * Sign-in attempts for one account, newest first. Works for deleted accounts
 * too. `currentSessionId` marks the caller's own session in the list.
 */
async function getLoginHistory(id, query, { currentSessionId } = {}) {
  await crud.findOrFail(id, { withDeleted: true });
  return loginHistory.listForUser(id, query, { currentSessionId });
}

/** Signs the user out everywhere: website and CMS, on every device. */
async function logout(id) {
  await crud.findOrFail(id);
  await endAllSessions(id, 'admin');
  return getById(id);
}

/** Signs the user out of one session (one device), from their login history. */
async function logoutSession(id, sessionId) {
  await crud.findOrFail(id);
  const session = await endSession(id, sessionId, 'admin');
  if (!session) {
    throw new ApiError(404, 'Session not found, or it has already ended');
  }
  return session;
}

module.exports = {
  ...crud,
  list,
  getById,
  create,
  update,
  remove,
  restore,
  hardDelete,
  getLoginHistory,
  logout,
  logoutSession,
};
