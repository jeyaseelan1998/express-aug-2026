const ACTIVE = 0;
const DELETED = 1;

/**
 * Query middleware is applied to every read/update entry point rather than to
 * `find` alone, so a service cannot accidentally surface a deleted row by
 * reaching for `findOne` or `countDocuments`. `findById` and `populate` both
 * run through `findOne`/`find` internally, so they are covered too.
 */
const GUARDED = [
  'count',
  'countDocuments',
  'distinct',
  'find',
  'findOne',
  'findOneAndReplace',
  'findOneAndUpdate',
  'updateMany',
  'updateOne',
];

/**
 * Mongoose plugin: gives a schema a numeric `deleted` flag (0 = live,
 * 1 = deleted) and hides deleted documents from ordinary queries, so deleting
 * a record keeps the row for audit while taking it out of circulation.
 *
 * Callers that genuinely need deleted rows opt in per query with
 * `.setOptions({ withDeleted: true })`, or by filtering on `deleted`
 * themselves -- an explicit filter always wins over the default.
 */
function softDeletePlugin(schema) {
  schema.add({
    deleted: {
      type: Number,
      enum: [ACTIVE, DELETED],
      default: ACTIVE,
      index: true,
    },
  });

  schema.pre(GUARDED, function skipDeleted(next) {
    if (!this.getOptions().withDeleted && this.getFilter().deleted === undefined) {
      // Excludes deleted rows rather than requiring deleted === 0, so documents
      // written before this plugin existed -- which carry no `deleted` field at
      // all -- still count as live instead of silently vanishing.
      this.where({ deleted: { $ne: DELETED } });
    }
    next();
  });

  /** Marks the document deleted in place; the row itself is never removed. */
  schema.methods.softDelete = function softDelete() {
    this.deleted = DELETED;
    return this.save();
  };
}

module.exports = softDeletePlugin;
module.exports.ACTIVE = ACTIVE;
module.exports.DELETED = DELETED;
