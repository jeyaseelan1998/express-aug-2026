const promoCodeService = require('../../services/promo-code.service');

async function list(req, res, next) {
  try {
    const result = await promoCodeService.listPromoCodes(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const promoCode = await promoCodeService.getPromoCode(req.params.id);
    res.status(200).json({ promoCode });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const promoCode = await promoCodeService.createPromoCode(req.body);
    res.status(201).json({ promoCode });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const promoCode = await promoCodeService.updatePromoCode(req.params.id, req.body);
    res.status(200).json({ promoCode });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await promoCodeService.deletePromoCode(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
