const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const toJsonPlugin = require('../../core/mongoose/to-json.plugin');
const softDeletePlugin = require('../../core/mongoose/soft-delete.plugin');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      required: true,
    },
    // Activity, maintained by auth/activity.js rather than written directly.
    lastLoginAt: {
      type: Date,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
    // Copied into every token at sign-in. Bumping it ends all of the user's
    // sessions at once, since requireAuth rejects tokens carrying an older one.
    sessionVersion: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.plugin(softDeletePlugin);
userSchema.plugin(toJsonPlugin, {
  hide: ['password', 'sessionVersion'],
  dates: ['lastLoginAt', 'lastSeenAt'],
});

module.exports = mongoose.model('User', userSchema);
