const { body } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const colorService = require('./color.service');

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const HEX_MESSAGE = 'Code must be a hex colour, e.g. #fff or #ff8800';

const keywordRules = () => [
  body('keywords').optional().isArray().withMessage('keywords must be an array'),
  body('keywords.*').optional().isString().trim().notEmpty(),
];

// Docs: color.docs.yaml
module.exports = createCrudRouter({
  service: colorService,
  key: 'color',
  rules: {
    create: [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('code').matches(HEX_COLOR).withMessage(HEX_MESSAGE),
      ...keywordRules(),
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('code').optional().matches(HEX_COLOR).withMessage(HEX_MESSAGE),
      ...keywordRules(),
    ],
  },
});
