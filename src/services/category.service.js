const Category = require('../models/category.model');
const ApiError = require('../utils/api-error');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id, { withDeleted = false } = {}) {
  const category = await Category.findById(id).setOptions({ withDeleted });
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
}

async function listCategories(query = {}, { withDeleted = false } = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Category.find().setOptions({ withDeleted }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Category.countDocuments().setOptions({ withDeleted }),
  ]);

  return { items: docs.map((doc) => doc.toJSON()), ...pageMeta({ page, limit, total }) };
}

async function getCategory(id) {
  const category = await findOrFail(id);
  return category.toJSON();
}

async function createCategory({ name }) {
  const category = await Category.create({ name });
  return category.toJSON();
}

async function updateCategory(id, { name }) {
  const category = await findOrFail(id);
  if (name !== undefined) category.name = name;
  await category.save();
  return category.toJSON();
}

/** Soft delete: the row is kept and flagged, not removed. */
async function deleteCategory(id) {
  const category = await findOrFail(id);
  await category.softDelete();
  return category.toJSON();
}

/**
 * Hard delete: removes the row for good, with no way back. Looks past the
 * soft-delete filter so an already-deleted record can still be purged.
 */
async function hardDeleteCategory(id) {
  const category = await findOrFail(id, { withDeleted: true });
  await category.deleteOne();
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
  hardDeleteCategory,
};
