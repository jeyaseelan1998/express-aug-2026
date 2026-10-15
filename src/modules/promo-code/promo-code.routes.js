const { body } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const promoCodeService = require('./promo-code.service');

// Docs: promo-code.docs.yaml
module.exports = createCrudRouter({
  service: promoCodeService,
  key: 'promoCode',
  rules: {
    create: [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('discount').isFloat({ min: 0, max: 100 }).withMessage('discount must be 0-100'),
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('discount')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('discount must be 0-100'),
    ],
  },
});
