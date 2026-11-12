const mongoose = require('mongoose');
const loginHistory = require('../login-history/login-history.service');
const { markSignedIn, markSignedOut } = require('./activity');
const { signToken, tokenExpiresAt, MAX_SESSION_SECONDS } = require('./jwt');
const User = require('./user.model');

/**
 * Session lifecycle. A session is one successful sign-in: a login history row
 * whose id travels in the token as `sid`. A token is accepted only while
 *   - it is under 4 hours old (it also expires then),
 *   - its `sv` matches the user's sessionVersion (bumped by "log out
 *     everywhere"), and
 *   - its `sid` is not in the user's revokedSessions (one device logged out).
 * The user document is already loaded on every request, so none of these
 * checks costs an extra query.
 */

/** Starts a session and returns what the client stores: `{ user, token, expiresAt }`. */
async function startSession(user, scope, context = {}) {
  const sid = new mongoose.Types.ObjectId();
  const token = signToken({ sub: user.id, scope, sv: user.sessionVersion ?? 0, sid: String(sid) });
  const expiresAt = tokenExpiresAt(token);

  await loginHistory.recordSession({
    _id: sid,
    user: user._id,
    scope,
    expiresAt: new Date(expiresAt * 1000),
    ...context,
  });
  markSignedIn(user);

  return { user, token, expiresAt };
}

/** Whether a verified token's session is still allowed for this user. */
function isSessionValid(user, payload) {
  if (!payload.sid) return false; // minted before sessions existed
  if (Date.now() / 1000 - payload.iat > MAX_SESSION_SECONDS) return false;
  if ((payload.sv ?? 0) !== (user.sessionVersion ?? 0)) return false;
  return !(user.revokedSessions || []).some((entry) => String(entry.sid) === payload.sid);
}

/**
 * Ends one session (one device). The row is marked ended for the history, and
 * the sid is revoked on the user so its token stops working at once. Expired
 * entries are pruned in the same atomic update. Resolves to the ended row, or
 * null if the session was already over.
 */
async function endSession(userId, sessionId, endedBy) {
  const row = await loginHistory.endSession(userId, sessionId, endedBy);
  if (!row) return null;

  const now = new Date();
  const revoked = {
    sid: new mongoose.Types.ObjectId(String(sessionId)),
    exp: new Date(row.expiresAt * 1000),
  };
  await User.updateOne(
    { _id: userId },
    [
      {
        $set: {
          revokedSessions: {
            $concatArrays: [
              {
                $filter: {
                  input: { $ifNull: ['$revokedSessions', []] },
                  cond: { $gt: ['$$this.exp', now] },
                },
              },
              [revoked],
            ],
          },
        },
      },
    ],
    { timestamps: false, updatePipeline: true }
  );
  return row;
}

/**
 * Ends every session the user has, on every device and surface, and marks
 * them offline. Bumping sessionVersion invalidates all their tokens at once,
 * so the revoked list is no longer needed and is cleared.
 */
async function endAllSessions(userId, endedBy) {
  await Promise.all([
    User.updateOne(
      { _id: userId },
      { $inc: { sessionVersion: 1 }, $set: { lastSeenAt: null, revokedSessions: [] } },
      { timestamps: false }
    ),
    loginHistory.endAllSessions(userId, endedBy),
  ]);
}

/** The user signing out of their own session (best effort, never throws). */
function signOutSession(userId, sessionId) {
  markSignedOut(userId);
  if (!sessionId) return;
  endSession(userId, sessionId, 'user').catch((err) =>
    console.error(`Failed to end session ${sessionId}:`, err.message)
  );
}

module.exports = { startSession, isSessionValid, endSession, endAllSessions, signOutSession };
