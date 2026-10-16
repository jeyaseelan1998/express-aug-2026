const mongoose = require('mongoose');
const toJsonPlugin = require('../../core/mongoose/to-json.plugin');

// Rows expire on their own after this many days, so the log stays bounded.
// MongoDB keeps the TTL it was created with: changing this later needs a
// `collMod` on the index (or dropping it so it is rebuilt).
const RETENTION_DAYS = Number(process.env.LOGIN_HISTORY_RETENTION_DAYS) || 90;

const USER_AGENT_MAX = 512;

/**
 * One sign-in attempt on an existing account. Append-only: rows are never
 * edited or soft-deleted, only expired by the TTL index (or removed with the
 * account on a hard delete).
 */
const loginHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    scope: {
      type: String,
      enum: ['web', 'cms'],
      required: true,
    },
    success: {
      type: Boolean,
      required: true,
    },
    // Why a failed attempt failed, e.g. 'invalid_password' or 'not_admin'.
    reason: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
      maxlength: USER_AGENT_MAX,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// Serves "this user's history, newest first" straight from the index.
loginHistorySchema.index({ user: 1, createdAt: -1 });
loginHistorySchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_DAYS * 24 * 60 * 60 });

loginHistorySchema.plugin(toJsonPlugin);

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
module.exports.USER_AGENT_MAX = USER_AGENT_MAX;
