const createCrudService = require('../../core/crud/crud.service');
const PromoCode = require('./promo-code.model');

module.exports = createCrudService(PromoCode, {
  label: 'Promo code',
  fields: ['name', 'discount'],
});
