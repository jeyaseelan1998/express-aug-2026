const express = require('express');
const { query } = require('express-validator');
const validate = require('../../core/middlewares/validate.middleware');
const createCrudController = require('../../core/crud/crud.controller');
const { paginationRules } = require('../../core/validators');
const productService = require('./product.service');
const { listTypeRules } = require('./product.validators');

const controller = createCrudController(productService, { key: 'product' });

// Docs: product.docs.yaml
// Public and read-only: the shop lists products but never writes them.
const router = express.Router();

router.get(
  '/',
  [
    ...paginationRules(),
    query('brand').optional().isMongoId().withMessage('brand must be a valid id'),
    query('category').optional().isMongoId().withMessage('category must be a valid id'),
    ...listTypeRules(),
  ],
  validate,
  controller.list
);

module.exports = router;
