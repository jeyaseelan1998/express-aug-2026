const Style = require('../models/style.model');
const Media = require('../models/media.model');
const ApiError = require('../utils/api-error');
const assertRefsExist = require('../utils/assert-refs');
const { paginationFrom, pageMeta } = require('../utils/paginate');
const { attachSignedUrl } = require('./media.service');

async function serialize(doc) {
  const json = doc.toJSON();
  json.image = await attachSignedUrl(json.image);
  return json;
}

async function findOrFail(id) {
  const style = await Style.findById(id).populate('image');
  if (!style) {
    throw new ApiError(404, 'Style not found');
  }
  return style;
}

async function listStyles(query = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Style.find().populate('image').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Style.countDocuments(),
  ]);

  const items = await Promise.all(docs.map(serialize));
  return { items, ...pageMeta({ page, limit, total }) };
}

async function getStyle(id) {
  return serialize(await findOrFail(id));
}

async function createStyle({ name, image = null }) {
  await assertRefsExist(Media, image, 'Media');

  const style = await Style.create({ name, image: image || null });
  await style.populate('image');
  return serialize(style);
}

async function updateStyle(id, { name, image }) {
  const style = await findOrFail(id);

  if (name !== undefined) style.name = name;
  if (image !== undefined) {
    await assertRefsExist(Media, image, 'Media');
    style.image = image || null;
  }

  await style.save();
  await style.populate('image');
  return serialize(style);
}

async function deleteStyle(id) {
  const style = await findOrFail(id);
  await style.deleteOne();
}

module.exports = { listStyles, getStyle, createStyle, updateStyle, deleteStyle };
