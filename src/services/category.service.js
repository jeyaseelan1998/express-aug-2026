const Category = require('../models/category.model');
const ApiError = require('../utils/api-error');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id) {
  const category = await Category.findById(id);
  if (!category) {
    throw new ApiError(404, 'Category not found');
  }
  return category;
}

async function listCategories(query = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Category.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Category.countDocuments(),
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

async function deleteCategory(id) {
  const category = await findOrFail(id);
  await category.deleteOne();
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
