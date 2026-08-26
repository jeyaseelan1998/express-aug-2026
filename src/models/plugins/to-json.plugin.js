function toUnixTimestamp(date) {
  return Math.floor(new Date(date).getTime() / 1000);
}

/**
 * Mongoose plugin: serializes createdAt/updatedAt as unix timestamps (seconds)
 * instead of ISO date strings, strips __v, and hides any field names passed
 * via options.hide (e.g. { hide: ['password'] }).
 */
function toJsonPlugin(schema, options = {}) {
  const hide = options.hide || [];

  schema.set('toJSON', {
    transform(doc, ret) {
      if (ret.createdAt) ret.createdAt = toUnixTimestamp(ret.createdAt);
      if (ret.updatedAt) ret.updatedAt = toUnixTimestamp(ret.updatedAt);
      delete ret.__v;
      hide.forEach((field) => delete ret[field]);
      return ret;
    },
  });
}

module.exports = toJsonPlugin;
