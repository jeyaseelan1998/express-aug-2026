const { body, query } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const productService = require('./product.service');

const idField = (field, label) =>
  body(field).optional({ values: 'null' }).isMongoId().withMessage(`${label} must be a valid id`);

const idArray = (field, label) => [
  body(field).optional().isArray().withMessage(`${label} must be an array`),
  body(`${field}.*`).isMongoId().withMessage(`${label} entries must be valid ids`),
];

// A factory: create and update each need their own validator chains.
const sharedRules = () => [
  body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be 0-5'),
  body('price').optional().isFloat({ min: 0 }).withMessage('price must be 0 or more'),
  body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('discount must be 0-100'),
  body('shipping').optional().isFloat({ min: 0 }).withMessage('shipping must be 0 or more'),
  body('description').optional().isString().trim(),
  body('details').optional().isString().trim(),
  body('minUnit').optional().isInt({ min: 1 }).withMessage('minUnit must be a positive integer'),
  body('maxUnit')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('maxUnit must be a positive integer'),
  body('faq').optional().isArray().withMessage('faq must be an array'),
  body('faq.*.question').trim().notEmpty().withMessage('Each faq entry needs a question'),
  body('faq.*.answer').trim().notEmpty().withMessage('Each faq entry needs an answer'),
  body('stock').optional().isArray().withMessage('stock must be an array'),
  body('stock.*.stock').isInt({ min: 0 }).withMessage('stock must be a whole number, 0 or more'),
  body('stock.*.size').isMongoId().withMessage('Each stock entry needs a valid size id'),
  body('images').optional().isArray().withMessage('images must be an array'),
  body('images.*').isMongoId().withMessage('images entries must be valid media ids'),
  ...idArray('category', 'category'),
  ...idArray('color', 'color'),
  ...idArray('style', 'style'),
  idField('brand', 'brand'),
];

// Docs: product.docs.yaml
module.exports = createCrudRouter({
  service: productService,
  key: 'product',
  rules: {
    list: [
      query('brand').optional().isMongoId().withMessage('brand must be a valid id'),
      query('category').optional().isMongoId().withMessage('category must be a valid id'),
    ],
    create: [
      body('name').trim().notEmpty().withMessage('Name is required'),
      body('thumbnail').isMongoId().withMessage('thumbnail must be a valid media id'),
      body('price').isFloat({ min: 0 }).withMessage('price is required and must be 0 or more'),
      ...sharedRules(),
    ],
    update: [
      body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
      body('thumbnail').optional().isMongoId().withMessage('thumbnail must be a valid media id'),
      ...sharedRules(),
    ],
  },
});
