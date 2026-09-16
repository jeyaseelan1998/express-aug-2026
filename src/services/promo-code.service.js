const PromoCode = require('../models/promo-code.model');
const ApiError = require('../utils/api-error');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id, { withDeleted = false } = {}) {
  const promoCode = await PromoCode.findById(id).setOptions({ withDeleted });
  if (!promoCode) {
    throw new ApiError(404, 'Promo code not found');
  }
  return promoCode;
}

async function listPromoCodes(query = {}, { withDeleted = false } = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    PromoCode.find().setOptions({ withDeleted }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    PromoCode.countDocuments().setOptions({ withDeleted }),
  ]);

  return { items: docs.map((doc) => doc.toJSON()), ...pageMeta({ page, limit, total }) };
}

async function getPromoCode(id) {
  const promoCode = await findOrFail(id);
  return promoCode.toJSON();
}

async function createPromoCode({ name, discount }) {
  const promoCode = await PromoCode.create({ name, discount });
  return promoCode.toJSON();
}

async function updatePromoCode(id, { name, discount }) {
  const promoCode = await findOrFail(id);
  if (name !== undefined) promoCode.name = name;
  if (discount !== undefined) promoCode.discount = discount;
  await promoCode.save();
  return promoCode.toJSON();
}

/** Soft delete: the row is kept and flagged, not removed. */
async function deletePromoCode(id) {
  const promoCode = await findOrFail(id);
  await promoCode.softDelete();
  return promoCode.toJSON();
}

/**
 * Undoes a soft delete. Looks past the soft-delete filter so the flagged row
 * can be found in the first place.
 */
async function restorePromoCode(id) {
  const promoCode = await findOrFail(id, { withDeleted: true });
  await promoCode.restore();
  return promoCode.toJSON();
}

/**
 * Hard delete: removes the row for good, with no way back. Looks past the
 * soft-delete filter so an already-deleted record can still be purged.
 */
async function hardDeletePromoCode(id) {
  const promoCode = await findOrFail(id, { withDeleted: true });
  await promoCode.deleteOne();
}

module.exports = {
  listPromoCodes,
  getPromoCode,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  restorePromoCode,
  hardDeletePromoCode,
};
