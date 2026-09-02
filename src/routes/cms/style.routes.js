const express = require('express');
const { body, param, query } = require('express-validator');
const styleController = require('../../controllers/cms/style.controller');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Style:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
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
 * /api/cms/style:
 *   get:
 *     summary: List styles
 *     tags: [CMS Style]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *     responses:
 *       200:
 *         description: Page of styles
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Style'
 *                 - $ref: '#/components/schemas/PageMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/WrongScope'
 *   post:
 *     summary: Create a style
 *     tags: [CMS Style]
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
 *                 style:
 *                   $ref: '#/components/schemas/Style'
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
  styleController.list
);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('image').optional({ values: 'null' }).isMongoId().withMessage('image must be a media id'),
  ],
  validate,
  styleController.create
);

/**
 * @swagger
 * /api/cms/style/{id}:
 *   get:
 *     summary: Get a style by id
 *     tags: [CMS Style]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: The style
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 style:
 *                   $ref: '#/components/schemas/Style'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a style
 *     tags: [CMS Style]
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
 *                 style:
 *                   $ref: '#/components/schemas/Style'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *   delete:
 *     summary: Delete a style
 *     tags: [CMS Style]
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

router.get('/:id', validateId, styleController.getById);
router.put(
  '/:id',
  validateId,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('image').optional({ values: 'null' }).isMongoId().withMessage('image must be a media id'),
  ],
  validate,
  styleController.update
);
router.delete('/:id', validateId, styleController.remove);

module.exports = router;
