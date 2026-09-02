const express = require('express');
const { body, param, query } = require('express-validator');
const promoCodeController = require('../../controllers/cms/promo-code.controller');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     PromoCode:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         discount:
 *           type: number
 *           description: Percentage, 0-100
 *         createdAt:
 *           type: integer
 *           format: int64
 *         updatedAt:
 *           type: integer
 *           format: int64
 */

/**
 * @swagger
 * /api/cms/promo-code:
 *   get:
 *     summary: List promo codes
 *     tags: [CMS Promo Code]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Page of promo codes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PromoCode'
 *                 - $ref: '#/components/schemas/PageMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/WrongScope'
 *   post:
 *     summary: Create a promo code
 *     tags: [CMS Promo Code]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, discount]
 *             properties:
 *               name:
 *                 type: string
 *               discount:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promoCode:
 *                   $ref: '#/components/schemas/PromoCode'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'

 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  ],
  validate,
  promoCodeController.list
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('discount').isFloat({ min: 0, max: 100 }).withMessage('discount must be 0-100'),
  ],
  validate,
  promoCodeController.create
);

/**
 * @swagger
 * /api/cms/promo-code/{id}:
 *   get:
 *     summary: Get a promo code by id
 *     tags: [CMS Promo Code]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: The promo code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promoCode:
 *                   $ref: '#/components/schemas/PromoCode'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a promo code
 *     tags: [CMS Promo Code]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               discount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 promoCode:
 *                   $ref: '#/components/schemas/PromoCode'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   delete:
 *     summary: Delete a promo code
 *     tags: [CMS Promo Code]
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

router.get('/:id', validateId, promoCodeController.getById);
router.put(
  '/:id',
  validateId,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('discount').optional().isFloat({ min: 0, max: 100 }).withMessage('discount must be 0-100'),
  ],
  validate,
  promoCodeController.update
);
router.delete('/:id', validateId, promoCodeController.remove);

module.exports = router;
