const express = require('express');
const { body, param, query } = require('express-validator');
const socialController = require('../../controllers/cms/social.controller');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Social:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         link:
 *           type: string
 *         image:
 *           allOf:
 *             - $ref: '#/components/schemas/Media'
 *           nullable: true
 *           description: Populated media, including a fresh signed url
 *         createdAt:
 *           type: integer
 *           format: int64
 *         updatedAt:
 *           type: integer
 *           format: int64
 */

/**
 * @swagger
 * /api/cms/social:
 *   get:
 *     summary: List social links
 *     tags: [CMS Social]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Page of social links
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Social'
 *                 - $ref: '#/components/schemas/PageMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/WrongScope'
 *   post:
 *     summary: Create a social link
 *     tags: [CMS Social]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, link]
 *             properties:
 *               name:
 *                 type: string
 *               link:
 *                 type: string
 *               image:
 *                 type: string
 *                 nullable: true
 *                 description: Media id
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 social:
 *                   $ref: '#/components/schemas/Social'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/RefNotFound'
 */
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  ],
  validate,
  socialController.list
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('link').trim().isURL().withMessage('link must be a valid url'),
    body('image').optional({ values: 'null' }).isMongoId().withMessage('image must be a media id'),
  ],
  validate,
  socialController.create
);

/**
 * @swagger
 * /api/cms/social/{id}:
 *   get:
 *     summary: Get a social link by id
 *     tags: [CMS Social]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: The social link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 social:
 *                   $ref: '#/components/schemas/Social'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a social link
 *     tags: [CMS Social]
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
 *               link:
 *                 type: string
 *               image:
 *                 type: string
 *                 nullable: true
 *                 description: Media id
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 social:
 *                   $ref: '#/components/schemas/Social'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   delete:
 *     summary: Permanently delete a social link
 *     description: >
 *       Hard delete. Removes the row outright, with no way back -- use the
 *       `PATCH /{id}/delete` soft delete unless the record must genuinely be
 *       purged. Works on already soft-deleted records too. Anything still
 *       referencing this id is left pointing at nothing.
 *     tags: [CMS Social]
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

router.get('/:id', validateId, socialController.getById);
router.put(
  '/:id',
  validateId,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('link').optional().trim().isURL().withMessage('link must be a valid url'),
    body('image').optional({ values: 'null' }).isMongoId().withMessage('image must be a media id'),
  ],
  validate,
  socialController.update
);

/**
 * @swagger
 * /api/cms/social/{id}/delete:
 *   patch:
 *     summary: Delete a social link
 *     description: >
 *       Soft delete. Sets `deleted` to 1 and returns the updated record; the
 *       row is kept but stops appearing in any list or lookup. Deleting an
 *       already-deleted record returns 404, since it is no longer visible.
 *     tags: [CMS Social]
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
 *                 social:
 *                   $ref: '#/components/schemas/Social'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/delete', validateId, socialController.remove);

/**
 * @swagger
 * /api/cms/social/{id}/restore:
 *   patch:
 *     summary: Restore a social link
 *     description: >
 *       Undoes a soft delete. Sets `deleted` back to 0 and returns the
 *       record, which shows up in ordinary lists and lookups again. Restoring
 *       a record that is not deleted leaves it as it is.
 *     tags: [CMS Social]
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
 *                 social:
 *                   $ref: '#/components/schemas/Social'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/restore', validateId, socialController.restore);
router.delete('/:id', validateId, socialController.hardDelete);

module.exports = router;
