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
 *     summary: Permanently delete a promo code
 *     description: >
 *       Hard delete. Removes the row outright, with no way back -- use the
 *       `PATCH /{id}/delete` soft delete unless the record must genuinely be
 *       purged. Works on already soft-deleted records too. Anything still
 *       referencing this id is left pointing at nothing.
 *     tags: [CMS Promo Code]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       204:
 *         description: Permanently deleted
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
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

/**
 * @swagger
 * /api/cms/promo-code/{id}/delete:
 *   patch:
 *     summary: Delete a promo code
 *     description: >
 *       Soft delete. Sets `deleted` to 1 and returns the updated record; the
 *       row is kept but stops appearing in any list or lookup. Deleting an
 *       already-deleted record returns 404, since it is no longer visible.
 *     tags: [CMS Promo Code]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: Deleted
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
 */
router.patch('/:id/delete', validateId, promoCodeController.remove);

/**
 * @swagger
 * /api/cms/promo-code/{id}/restore:
 *   patch:
 *     summary: Restore a promo code
 *     description: >
 *       Undoes a soft delete. Sets `deleted` back to 0 and returns the
 *       record, which shows up in ordinary lists and lookups again. Restoring
 *       a record that is not deleted leaves it as it is.
 *     tags: [CMS Promo Code]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: Restored
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
 */
router.patch('/:id/restore', validateId, promoCodeController.restore);
router.delete('/:id', validateId, promoCodeController.hardDelete);

module.exports = router;
