const { body } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const categoryService = require('./category.service');

// Docs: category.docs.yaml
module.exports = createCrudRouter({
  service: categoryService,
  key: 'category',
  rules: {
    create: [body('name').trim().notEmpty().withMessage('Name is required')],
    update: [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  },
});
