function toUnixTimestamp(date) {
  return Math.floor(new Date(date).getTime() / 1000);
}

/**
 * Mongoose plugin: serializes createdAt/updatedAt as unix timestamps (seconds)
 * instead of ISO date strings, strips __v, and hides any field names passed
 * via options.hide (e.g. { hide: ['password'] }). Other date fields listed in
 * options.dates (e.g. { dates: ['lastSeenAt'] }) are converted the same way.
 */
function toJsonPlugin(schema, options = {}) {
  const hide = options.hide || [];
  const dates = ['createdAt', 'updatedAt', ...(options.dates || [])];

  schema.set('toJSON', {
    transform(doc, ret) {
      dates.forEach((field) => {
        if (ret[field]) ret[field] = toUnixTimestamp(ret[field]);
      });
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      hide.forEach((field) => delete ret[field]);
      return ret;
    },
  });
}

module.exports = toJsonPlugin;
