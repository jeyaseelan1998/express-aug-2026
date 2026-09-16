const Size = require('../models/size.model');
const ApiError = require('../utils/api-error');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id, { withDeleted = false } = {}) {
  const size = await Size.findById(id).setOptions({ withDeleted });
  if (!size) {
    throw new ApiError(404, 'Size not found');
  }
  return size;
}

async function listSizes(query = {}, { withDeleted = false } = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Size.find().setOptions({ withDeleted }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Size.countDocuments().setOptions({ withDeleted }),
  ]);

  return { items: docs.map((doc) => doc.toJSON()), ...pageMeta({ page, limit, total }) };
}

async function getSize(id) {
  const size = await findOrFail(id);
  return size.toJSON();
}

async function createSize({ name }) {
  const size = await Size.create({ name });
  return size.toJSON();
}

async function updateSize(id, { name }) {
  const size = await findOrFail(id);
  if (name !== undefined) size.name = name;
  await size.save();
  return size.toJSON();
}

/** Soft delete: the row is kept and flagged, not removed. */
async function deleteSize(id) {
  const size = await findOrFail(id);
  await size.softDelete();
  return size.toJSON();
}

/**
 * Hard delete: removes the row for good, with no way back. Looks past the
 * soft-delete filter so an already-deleted record can still be purged.
 */
async function hardDeleteSize(id) {
  const size = await findOrFail(id, { withDeleted: true });
  await size.deleteOne();
}

module.exports = { listSizes, getSize, createSize, updateSize, deleteSize, hardDeleteSize };
