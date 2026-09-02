const PromoCode = require('../models/promo-code.model');
const ApiError = require('../utils/api-error');
const { paginationFrom, pageMeta } = require('../utils/paginate');

async function findOrFail(id) {
  const promoCode = await PromoCode.findById(id);
  if (!promoCode) {
    throw new ApiError(404, 'Promo code not found');
  }
  return promoCode;
}

async function listPromoCodes(query = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    PromoCode.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    PromoCode.countDocuments(),
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

async function deletePromoCode(id) {
  const promoCode = await findOrFail(id);
  await promoCode.deleteOne();
}

module.exports = {
  listPromoCodes,
  getPromoCode,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
};
