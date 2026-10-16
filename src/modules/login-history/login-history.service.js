const { paginationFrom, pageMeta } = require('../../core/paginate');
const LoginHistory = require('./login-history.model');

/**
 * Logs a sign-in attempt without holding up the response: the write runs in
 * the background and a failure is logged, never surfaced to the caller.
 */
function record({ user, scope, success, reason = null, ip = null, userAgent = null }) {
  LoginHistory.create({
    user,
    scope,
    success,
    reason,
    ip,
    userAgent: userAgent ? userAgent.slice(0, LoginHistory.USER_AGENT_MAX) : null,
  }).catch((err) => console.error(`Failed to record login for user ${user}:`, err.message));
}

async function listForUser(userId, query = {}) {
  const { page, limit, skip } = paginationFrom(query);
  const filter = { user: userId };

  const [docs, total] = await Promise.all([
    LoginHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LoginHistory.countDocuments(filter),
  ]);

  return { items: docs.map((doc) => doc.toJSON()), ...pageMeta({ page, limit, total }) };
}

async function deleteForUser(userId) {
  await LoginHistory.deleteMany({ user: userId });
}

module.exports = { record, listForUser, deleteForUser };
