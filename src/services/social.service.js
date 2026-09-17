const Social = require('../models/social.model');
const Color = require('../models/color.model');
const ApiError = require('../utils/api-error');
const assertRefsExist = require('../utils/assert-refs');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id, { withDeleted = false } = {}) {
  const social = await Social.findById(id).setOptions({ withDeleted }).populate('background');
  if (!social) {
    throw new ApiError(404, 'Social link not found');
  }
  return social;
}

async function listSocials(query = {}, { withDeleted = false } = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Social.find()
      .setOptions({ withDeleted })
      .populate('background')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Social.countDocuments().setOptions({ withDeleted }),
  ]);

  return { items: docs.map((doc) => doc.toJSON()), ...pageMeta({ page, limit, total }) };
}

async function getSocial(id) {
  const social = await findOrFail(id);
  return social.toJSON();
}

async function createSocial({ name, link, icon, background = null }) {
  await assertRefsExist(Color, background, 'Color');

  const social = await Social.create({ name, link, icon, background: background || null });
  await social.populate('background');
  return social.toJSON();
}

async function updateSocial(id, { name, link, icon, background }) {
  const social = await findOrFail(id);

  if (name !== undefined) social.name = name;
  if (link !== undefined) social.link = link;
  if (icon !== undefined) social.icon = icon;
  if (background !== undefined) {
    await assertRefsExist(Color, background, 'Color');
    social.background = background || null;
  }

  await social.save();
  await social.populate('background');
  return social.toJSON();
}

/** Soft delete: the row is kept and flagged, not removed. */
async function deleteSocial(id) {
  const social = await findOrFail(id);
  await social.softDelete();
  return social.toJSON();
}

/**
 * Undoes a soft delete. Looks past the soft-delete filter so the flagged row
 * can be found in the first place.
 */
async function restoreSocial(id) {
  const social = await findOrFail(id, { withDeleted: true });
  await social.restore();
  return social.toJSON();
}

/**
 * Hard delete: removes the row for good, with no way back. Looks past the
 * soft-delete filter so an already-deleted record can still be purged.
 */
async function hardDeleteSocial(id) {
  const social = await findOrFail(id, { withDeleted: true });
  await social.deleteOne();
}

module.exports = {
  listSocials,
  getSocial,
  createSocial,
  updateSocial,
  deleteSocial,
  restoreSocial,
  hardDeleteSocial,
};
