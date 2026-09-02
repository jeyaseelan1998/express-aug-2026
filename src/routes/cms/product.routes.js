const express = require('express');
const { body, param, query } = require('express-validator');
const productController = require('../../controllers/cms/product.controller');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductFaq:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         question:
 *           type: string
 *         answer:
 *           type: string
 *     ProductStock:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         stock:
 *           type: integer
 *         size:
 *           $ref: '#/components/schemas/Size'
 *     Product:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         thumbnail:
 *           allOf:
 *             - $ref: '#/components/schemas/Media'
 *           description: Populated media, including a fresh signed url
 *         images:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Media'
 *         rating:
 *           type: number
 *           description: 0-5, decimals allowed
 *         price:
 *           type: number
 *         discount:
 *           type: number
 *           description: Percentage, 0-100
 *         description:
 *           type: string
 *         details:
 *           type: string
 *         faq:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductFaq'
 *         category:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         color:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Color'
 *         style:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Style'
 *         stock:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ProductStock'
 *         shipping:
 *           type: number
 *         brand:
 *           allOf:
 *             - $ref: '#/components/schemas/Brand'
 *           nullable: true
 *         minUnit:
 *           type: integer
 *         maxUnit:
 *           type: integer
 *           nullable: true
 *         createdAt:
 *           type: integer
 *           format: int64
 *         updatedAt:
 *           type: integer
 *           format: int64
 *     ProductInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *         thumbnail:
 *           type: string
 *           description: Media id
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         rating:
 *           type: number
 *         price:
 *           type: number
 *         discount:
 *           type: number
 *         description:
 *           type: string
 *         details:
 *           type: string
 *         faq:
 *           type: array
 *           items:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *         category:
 *           type: array
 *           items:
 *             type: string
 *         color:
 *           type: array
 *           items:
 *             type: string
 *         style:
 *           type: array
 *           items:
 *             type: string
 *         stock:
 *           type: array
 *           items:
 *             type: object
 *             required: [stock, size]
 *             properties:
 *               stock:
 *                 type: integer
 *               size:
 *                 type: string
 *                 description: Size id
 *         shipping:
 *           type: number
 *         brand:
 *           type: string
 *           nullable: true
 *         minUnit:
 *           type: integer
 *         maxUnit:
 *           type: integer
 *           nullable: true
 */

/**
 * @swagger
 * /api/cms/product:
 *   get:
 *     summary: List products
 *     description: >
 *       Media, category, colour, style, brand and stock size refs are all
 *       populated, and every media ref carries a fresh signed url.
 *     tags: [CMS Product]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Filter by brand id
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category id
 *     responses:
 *       200:
 *         description: Page of products
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                 - $ref: '#/components/schemas/PageMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/WrongScope'
 *   post:
 *     summary: Create a product
 *     description: >
 *       Every referenced id is checked for existence first, so a product can
 *       never be stored pointing at a missing media, category, colour, style,
 *       brand or size.
 *     tags: [CMS Product]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             allOf:
 *               - $ref: '#/components/schemas/ProductInput'
 *               - type: object
 *                 required: [name, thumbnail, price]
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       422:
 *         $ref: '#/components/responses/RefNotFound'
 */

const idField = (field, label) =>
  body(field).optional({ values: 'null' }).isMongoId().withMessage(`${label} must be a valid id`);

const idArray = (field, label) => [
  body(field).optional().isArray().withMessage(`${label} must be an array`),
  body(`${field}.*`).isMongoId().withMessage(`${label} entries must be valid ids`),
];

const sharedRules = [
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

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
    query('brand').optional().isMongoId().withMessage('brand must be a valid id'),
    query('category').optional().isMongoId().withMessage('category must be a valid id'),
  ],
  validate,
  productController.list
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('thumbnail').isMongoId().withMessage('thumbnail must be a valid media id'),
    body('price').isFloat({ min: 0 }).withMessage('price is required and must be 0 or more'),
    ...sharedRules,
  ],
  validate,
  productController.create
);

/**
 * @swagger
 * /api/cms/product/{id}:
 *   get:
 *     summary: Get a product by id
 *     tags: [CMS Product]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: The product
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a product
 *     description: Partial update. Only the fields present in the body are changed.
 *     tags: [CMS Product]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 product:
 *                   $ref: '#/components/schemas/Product'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       422:
 *         $ref: '#/components/responses/RefNotFound'
 *   delete:
 *     summary: Delete a product
 *     tags: [CMS Product]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       204:
 *         description: Deleted
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
const validateId = [param('id').isMongoId().withMessage('A valid id is required'), validate];

router.get('/:id', validateId, productController.getById);
router.put(
  '/:id',
  validateId,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('thumbnail').optional().isMongoId().withMessage('thumbnail must be a valid media id'),
    ...sharedRules,
  ],
  validate,
  productController.update
);
router.delete('/:id', validateId, productController.remove);

module.exports = router;
