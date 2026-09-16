const Brand = require('../models/brand.model');
const Media = require('../models/media.model');
const ApiError = require('../utils/api-error');
const assertRefsExist = require('../utils/assert-refs');
const { paginationFrom, pageMeta } = require('../utils/paginate');
const { attachSignedUrl } = require('./media.service');

/** The image ref is populated, then signed so a CMS can render it directly. */
async function serialize(doc) {
  const json = doc.toJSON();
  json.image = await attachSignedUrl(json.image);
  return json;
}

async function findOrFail(id, { withDeleted = false } = {}) {
  const brand = await Brand.findById(id).setOptions({ withDeleted }).populate('image');
  if (!brand) {
    throw new ApiError(404, 'Brand not found');
  }
  return brand;
}

async function listBrands(query = {}, { withDeleted = false } = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Brand.find()
      .setOptions({ withDeleted })
      .populate('image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Brand.countDocuments().setOptions({ withDeleted }),
  ]);

  const items = await Promise.all(docs.map(serialize));
  return { items, ...pageMeta({ page, limit, total }) };
}

async function getBrand(id) {
  return serialize(await findOrFail(id));
}

async function createBrand({ name, image = null }) {
  await assertRefsExist(Media, image, 'Media');

  const brand = await Brand.create({ name, image: image || null });
  await brand.populate('image');
  return serialize(brand);
}

async function updateBrand(id, { name, image }) {
  const brand = await findOrFail(id);

  if (name !== undefined) brand.name = name;
  if (image !== undefined) {
    await assertRefsExist(Media, image, 'Media');
    brand.image = image || null;
  }

  await brand.save();
  await brand.populate('image');
  return serialize(brand);
}

/** Soft delete: the row is kept and flagged, not removed. */
async function deleteBrand(id) {
  const brand = await findOrFail(id);
  await brand.softDelete();
  return serialize(brand);
}

/**
 * Hard delete: removes the row for good, with no way back. Looks past the
 * soft-delete filter so an already-deleted record can still be purged.
 */
async function hardDeleteBrand(id) {
  const brand = await findOrFail(id, { withDeleted: true });
  await brand.deleteOne();
}

module.exports = { listBrands, getBrand, createBrand, updateBrand, deleteBrand, hardDeleteBrand };
