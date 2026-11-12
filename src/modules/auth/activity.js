const User = require('./user.model');

// lastSeenAt is refreshed at most this often per user, so an active session
// costs one small write a minute instead of one per request.
const SEEN_THROTTLE_MS = 60 * 1000;

// Seen within this window counts as online.
const ONLINE_WINDOW_MS = 5 * 60 * 1000;

/**
 * Activity writes never touch updatedAt (it tracks edits to the account, not
 * sign-ins) and never block the request: a failed write is logged and dropped.
 */
function setActivity(userId, fields) {
  User.updateOne({ _id: userId }, { $set: fields }, { timestamps: false }).catch((err) =>
    console.error(`Failed to update activity for user ${userId}:`, err.message)
  );
}

function markSignedIn(user) {
  const now = new Date();
  user.lastLoginAt = now;
  user.lastSeenAt = now;
  setActivity(user._id, { lastLoginAt: now, lastSeenAt: now });
}

/** Called on every authenticated request; writes only when the value is stale. */
function touchLastSeen(user) {
  const now = Date.now();
  if (user.lastSeenAt && now - user.lastSeenAt.getTime() < SEEN_THROTTLE_MS) return;
  user.lastSeenAt = new Date(now);
  setActivity(user._id, { lastSeenAt: user.lastSeenAt });
}

function markSignedOut(userId) {
  setActivity(userId, { lastSeenAt: null });
}

// lastSeenAt is a Date on a document but unix seconds once serialized.
const toMillis = (value) => {
  if (!value) return 0;
  return typeof value === 'number' ? value * 1000 : new Date(value).getTime();
};

/**
 * 'online' when seen within the last few minutes, otherwise 'offline'. Takes
 * a user document or its serialized JSON.
 */
function presenceOf(user) {
  const lastSeen = toMillis(user.lastSeenAt);
  return Date.now() - lastSeen < ONLINE_WINDOW_MS ? 'online' : 'offline';
}

module.exports = {
  markSignedIn,
  touchLastSeen,
  markSignedOut,
  presenceOf,
  ONLINE_WINDOW_MS,
};
