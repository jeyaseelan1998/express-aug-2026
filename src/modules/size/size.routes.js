const { body } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const sizeService = require('./size.service');

// Docs: size.docs.yaml
module.exports = createCrudRouter({
  service: sizeService,
  key: 'size',
  rules: {
    create: [body('name').trim().notEmpty().withMessage('Name is required')],
    update: [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  },
});
