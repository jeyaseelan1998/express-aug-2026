const mongoose = require('mongoose');
const { paginationFrom, pageMeta } = require('../../core/paginate');
const LoginHistory = require('./login-history.model');

const trimUserAgent = (userAgent) =>
  userAgent ? userAgent.slice(0, LoginHistory.USER_AGENT_MAX) : null;

/** Filter for sessions that are still usable: not ended and not expired. */
const activeFilter = (now = new Date()) => ({
  success: true,
  endedAt: null,
  expiresAt: { $gt: now },
});

/**
 * Logs a failed attempt without holding up the response: the write runs in
 * the background and a failure is logged, never surfaced to the caller.
 */
function recordFailure({ user, scope, reason, ip = null, userAgent = null }) {
  LoginHistory.create({
    user,
    scope,
    success: false,
    reason,
    ip,
    userAgent: trimUserAgent(userAgent),
  }).catch((err) => console.error(`Failed to record login for user ${user}:`, err.message));
}

/**
 * Records a successful sign-in, which is also the session. Awaited: its id
 * goes into the token, so the row has to exist before the token is handed out.
 */
async function recordSession({ _id, user, scope, expiresAt, ip = null, userAgent = null }) {
  await LoginHistory.create({
    _id,
    user,
    scope,
    success: true,
    expiresAt,
    ip,
    userAgent: trimUserAgent(userAgent),
  });
}

function serializeRow(doc, { now = Date.now(), currentSessionId } = {}) {
  const active =
    doc.success && !doc.endedAt && Boolean(doc.expiresAt) && doc.expiresAt.getTime() > now;
  return {
    ...doc.toJSON(),
    active,
    current: Boolean(currentSessionId) && String(doc._id) === String(currentSessionId),
  };
}

/**
 * Sign-in attempts for one account, newest first. Each row says whether its
 * session is still `active`, and `current` marks the caller's own session.
 */
async function listForUser(userId, query = {}, { currentSessionId } = {}) {
  const { page, limit, skip } = paginationFrom(query);
  const filter = { user: userId };

  const [docs, total] = await Promise.all([
    LoginHistory.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    LoginHistory.countDocuments(filter),
  ]);

  const now = Date.now();
  return {
    items: docs.map((doc) => serializeRow(doc, { now, currentSessionId })),
    ...pageMeta({ page, limit, total }),
  };
}

/** Marks one active session ended. Resolves to the updated row, or null if it was not active. */
async function endSession(userId, sessionId, endedBy) {
  const doc = await LoginHistory.findOneAndUpdate(
    { _id: sessionId, user: userId, ...activeFilter() },
    { $set: { endedAt: new Date(), endedBy } },
    { returnDocument: 'after' }
  );
  return doc && serializeRow(doc);
}

async function endAllSessions(userId, endedBy) {
  await LoginHistory.updateMany(
    { user: userId, ...activeFilter() },
    { $set: { endedAt: new Date(), endedBy } }
  );
}

/** Active session counts for many users in one query, as a Map of id -> count. */
async function countActive(userIds) {
  if (!userIds.length) return new Map();
  const rows = await LoginHistory.aggregate([
    {
      $match: {
        user: { $in: userIds.map((id) => new mongoose.Types.ObjectId(String(id))) },
        ...activeFilter(),
      },
    },
    { $group: { _id: '$user', count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

async function deleteForUser(userId) {
  await LoginHistory.deleteMany({ user: userId });
}

module.exports = {
  recordFailure,
  recordSession,
  listForUser,
  endSession,
  endAllSessions,
  countActive,
  deleteForUser,
};
