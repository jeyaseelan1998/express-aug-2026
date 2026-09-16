const express = require('express');
const { body, param, query } = require('express-validator');
const sizeController = require('../../controllers/cms/size.controller');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Size:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         createdAt:
 *           type: integer
 *           format: int64
 *         updatedAt:
 *           type: integer
 *           format: int64
 */

/**
 * @swagger
 * /api/cms/size:
 *   get:
 *     summary: List sizes
 *     tags: [CMS Size]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Page of sizes
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Size'
 *                 - $ref: '#/components/schemas/PageMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/WrongScope'
 *   post:
 *     summary: Create a size
 *     tags: [CMS Size]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 size:
 *                   $ref: '#/components/schemas/Size'
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
  sizeController.list
);

router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Name is required')],
  validate,
  sizeController.create
);

/**
 * @swagger
 * /api/cms/size/{id}:
 *   get:
 *     summary: Get a size by id
 *     tags: [CMS Size]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: The size
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 size:
 *                   $ref: '#/components/schemas/Size'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a size
 *     tags: [CMS Size]
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
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 size:
 *                   $ref: '#/components/schemas/Size'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   delete:
 *     summary: Permanently delete a size
 *     description: >
 *       Hard delete. Removes the row outright, with no way back -- use the
 *       `PATCH /{id}/delete` soft delete unless the record must genuinely be
 *       purged. Works on already soft-deleted records too. Anything still
 *       referencing this id is left pointing at nothing.
 *     tags: [CMS Size]
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

router.get('/:id', validateId, sizeController.getById);
router.put(
  '/:id',
  validateId,
  [body('name').optional().trim().notEmpty().withMessage('Name cannot be empty')],
  validate,
  sizeController.update
);

/**
 * @swagger
 * /api/cms/size/{id}/delete:
 *   patch:
 *     summary: Delete a size
 *     description: >
 *       Soft delete. Sets `deleted` to 1 and returns the updated record; the
 *       row is kept but stops appearing in any list or lookup. Deleting an
 *       already-deleted record returns 404, since it is no longer visible.
 *     tags: [CMS Size]
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
 *                 size:
 *                   $ref: '#/components/schemas/Size'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/delete', validateId, sizeController.remove);

/**
 * @swagger
 * /api/cms/size/{id}/restore:
 *   patch:
 *     summary: Restore a size
 *     description: >
 *       Undoes a soft delete. Sets `deleted` back to 0 and returns the
 *       record, which shows up in ordinary lists and lookups again. Restoring
 *       a record that is not deleted leaves it as it is.
 *     tags: [CMS Size]
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
 *                 size:
 *                   $ref: '#/components/schemas/Size'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/restore', validateId, sizeController.restore);
router.delete('/:id', validateId, sizeController.hardDelete);

module.exports = router;
