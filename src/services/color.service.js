const Color = require('../models/color.model');
const ApiError = require('../utils/api-error');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id) {
  const color = await Color.findById(id);
  if (!color) {
    throw new ApiError(404, 'Color not found');
  }
  return color;
}

async function listColors(query = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Color.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Color.countDocuments(),
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

async function deleteColor(id) {
  const color = await findOrFail(id);
  await color.deleteOne();
}

module.exports = { listColors, getColor, createColor, updateColor, deleteColor };
