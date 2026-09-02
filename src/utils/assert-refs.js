const ApiError = require('./api-error');

/**
 * Verifies every referenced id actually exists before it is stored, so a
 * create or update cannot leave a dangling ObjectId behind. Names the ids
 * that were missing, since "Category not found" alone is hard to act on.
 */
async function assertRefsExist(Model, ids, label) {
  const list = (Array.isArray(ids) ? ids : [ids]).filter((id) => id !== null && id !== undefined);
  const unique = [...new Set(list.map(String))];
  if (!unique.length) return;

  const found = await Model.find({ _id: { $in: unique } })
    .select('_id')
    .lean();
  if (found.length === unique.length) return;

  const foundIds = new Set(found.map((doc) => String(doc._id)));
  const missing = unique.filter((id) => !foundIds.has(id));
  throw new ApiError(422, `${label} not found: ${missing.join(', ')}`);
}

module.exports = assertRefsExist;
