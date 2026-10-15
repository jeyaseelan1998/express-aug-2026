const { body } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const socialService = require('./social.service');

const backgroundRule = () =>
  body('background')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('background must be a colour id');

// Docs: social.docs.yaml
module.exports = createCrudRouter({
  service: socialService,
  key: 'social',
  rules: {
    create: [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('link').trim().isURL().withMessage('link must be a valid url'),
      body('icon').trim().notEmpty().withMessage('Icon is required'),
      backgroundRule(),
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('link').optional().trim().isURL().withMessage('link must be a valid url'),
      body('icon').optional().trim().notEmpty().withMessage('Icon cannot be empty'),
      backgroundRule(),
    ],
  },
});
