const express = require('express');
const { body, param, query } = require('express-validator');
const colorController = require('../../controllers/cms/color.controller');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Color:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         code:
 *           type: string
 *           example: '#ff8800'
 *         keywords:
 *           type: array
 *           items:
 *             type: string
 *         createdAt:
 *           type: integer
 *           format: int64
 *         updatedAt:
 *           type: integer
 *           format: int64
 */

/**
 * @swagger
 * /api/cms/color:
 *   get:
 *     summary: List colours
 *     tags: [CMS Color]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Page of colours
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Color'
 *                 - $ref: '#/components/schemas/PageMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/WrongScope'
 *   post:
 *     summary: Create a colour
 *     tags: [CMS Color]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, code]
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *                 example: '#ff8800'
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 color:
 *                   $ref: '#/components/schemas/Color'
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
  colorController.list
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('code')
      .matches(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i)
      .withMessage('Code must be a hex colour, e.g. #fff or #ff8800'),
    body('keywords').optional().isArray().withMessage('keywords must be an array'),
    body('keywords.*').optional().isString().trim().notEmpty(),
  ],
  validate,
  colorController.create
);

/**
 * @swagger
 * /api/cms/color/{id}:
 *   get:
 *     summary: Get a colour by id
 *     tags: [CMS Color]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: The colour
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 color:
 *                   $ref: '#/components/schemas/Color'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a colour
 *     tags: [CMS Color]
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
 *               code:
 *                 type: string
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 color:
 *                   $ref: '#/components/schemas/Color'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   delete:
 *     summary: Permanently delete a colour
 *     description: >
 *       Hard delete. Removes the row outright, with no way back -- use the
 *       `PATCH /{id}/delete` soft delete unless the record must genuinely be
 *       purged. Works on already soft-deleted records too. Anything still
 *       referencing this id is left pointing at nothing.
 *     tags: [CMS Color]
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

router.get('/:id', validateId, colorController.getById);
router.put(
  '/:id',
  validateId,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('code')
      .optional()
      .matches(/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i)
      .withMessage('Code must be a hex colour, e.g. #fff or #ff8800'),
    body('keywords').optional().isArray().withMessage('keywords must be an array'),
    body('keywords.*').optional().isString().trim().notEmpty(),
  ],
  validate,
  colorController.update
);

/**
 * @swagger
 * /api/cms/color/{id}/delete:
 *   patch:
 *     summary: Delete a colour
 *     description: >
 *       Soft delete. Sets `deleted` to 1 and returns the updated record; the
 *       row is kept but stops appearing in any list or lookup. Deleting an
 *       already-deleted record returns 404, since it is no longer visible.
 *     tags: [CMS Color]
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
 *                 color:
 *                   $ref: '#/components/schemas/Color'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/delete', validateId, colorController.remove);

/**
 * @swagger
 * /api/cms/color/{id}/restore:
 *   patch:
 *     summary: Restore a colour
 *     description: >
 *       Undoes a soft delete. Sets `deleted` back to 0 and returns the
 *       record, which shows up in ordinary lists and lookups again. Restoring
 *       a record that is not deleted leaves it as it is.
 *     tags: [CMS Color]
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
 *                 color:
 *                   $ref: '#/components/schemas/Color'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/restore', validateId, colorController.restore);
router.delete('/:id', validateId, colorController.hardDelete);

module.exports = router;
