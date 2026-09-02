const Social = require('../models/social.model');
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
  const social = await Social.findById(id).populate('image');
  if (!social) {
    throw new ApiError(404, 'Social link not found');
  }
  return social;
}

async function listSocials(query = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Social.find().populate('image').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Social.countDocuments(),
  ]);

  const items = await Promise.all(docs.map(serialize));
  return { items, ...pageMeta({ page, limit, total }) };
}

async function getSocial(id) {
  return serialize(await findOrFail(id));
}

async function createSocial({ name, link, image = null }) {
  await assertRefsExist(Media, image, 'Media');

  const social = await Social.create({ name, link, image: image || null });
  await social.populate('image');
  return serialize(social);
}

async function updateSocial(id, { name, link, image }) {
  const social = await findOrFail(id);

  if (name !== undefined) social.name = name;
  if (link !== undefined) social.link = link;
  if (image !== undefined) {
    await assertRefsExist(Media, image, 'Media');
    social.image = image || null;
  }

  await social.save();
  await social.populate('image');
  return serialize(social);
}

async function deleteSocial(id) {
  const social = await findOrFail(id);
  await social.deleteOne();
}

module.exports = { listSocials, getSocial, createSocial, updateSocial, deleteSocial };
