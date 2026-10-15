const { body } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const styleService = require('./style.service');

const imageRule = () =>
  body('image').optional({ values: 'null' }).isMongoId().withMessage('image must be a media id');

// Docs: style.docs.yaml
module.exports = createCrudRouter({
  service: styleService,
  key: 'style',
  rules: {
    create: [body('name').trim().notEmpty().withMessage('Name is required'), imageRule()],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      imageRule(),
    ],
  },
});
