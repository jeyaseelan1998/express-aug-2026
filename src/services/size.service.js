const Size = require('../models/size.model');
const ApiError = require('../utils/api-error');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id) {
  const size = await Size.findById(id);
  if (!size) {
    throw new ApiError(404, 'Size not found');
  }
  return size;
}

async function listSizes(query = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Size.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Size.countDocuments(),
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

async function deleteSize(id) {
  const size = await findOrFail(id);
  await size.deleteOne();
}

module.exports = { listSizes, getSize, createSize, updateSize, deleteSize };
