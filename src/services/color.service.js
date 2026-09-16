const Color = require('../models/color.model');
const ApiError = require('../utils/api-error');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id, { withDeleted = false } = {}) {
  const color = await Color.findById(id).setOptions({ withDeleted });
  if (!color) {
    throw new ApiError(404, 'Color not found');
  }
  return color;
}

async function listColors(query = {}, { withDeleted = false } = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Color.find().setOptions({ withDeleted }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Color.countDocuments().setOptions({ withDeleted }),
  ]);

  return { items: docs.map((doc) => doc.toJSON()), ...pageMeta({ page, limit, total }) };
}

async function getColor(id) {
  const color = await findOrFail(id);
  return color.toJSON();
}

async function createColor({ name, code, keywords }) {
  const color = await Color.create({ name, code, keywords });
  return color.toJSON();
}

async function updateColor(id, { name, code, keywords }) {
  const color = await findOrFail(id);
  if (name !== undefined) color.name = name;
  if (code !== undefined) color.code = code;
  if (keywords !== undefined) color.keywords = keywords;
  await color.save();
  return color.toJSON();
}

/** Soft delete: the row is kept and flagged, not removed. */
async function deleteColor(id) {
  const color = await findOrFail(id);
  await color.softDelete();
  return color.toJSON();
}

/**
 * Hard delete: removes the row for good, with no way back. Looks past the
 * soft-delete filter so an already-deleted record can still be purged.
 */
async function hardDeleteColor(id) {
  const color = await findOrFail(id, { withDeleted: true });
  await color.deleteOne();
}

module.exports = { listColors, getColor, createColor, updateColor, deleteColor, hardDeleteColor };
