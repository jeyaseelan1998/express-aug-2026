const { body } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const brandService = require('./brand.service');

const imageRule = () =>
  body('image').optional({ values: 'null' }).isMongoId().withMessage('image must be a media id');

// Docs: brand.docs.yaml
module.exports = createCrudRouter({
  service: brandService,
  key: 'brand',
  rules: {
    create: [body('name').trim().notEmpty().withMessage('Name is required'), imageRule()],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      imageRule(),
    ],
  },
});
