const express = require('express');
const { body, param, query } = require('express-validator');
const pageController = require('../../controllers/cms/page.controller');
const validate = require('../../middlewares/validate.middleware');
const { WIDGET_TYPES } = require('../../models/widgets');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     HeroWidget:
 *       type: object
 *       description: Hero banner. `type` is always `hero`.
 *       required: [type, title, image]
 *       properties:
 *         _id:
 *           type: string
 *         type:
 *           type: string
 *           enum: [hero]
 *         title:
 *           type: string
 *         text:
 *           type: string
 *           nullable: true
 *         image:
 *           allOf:
 *             - $ref: '#/components/schemas/Media'
 *           description: Populated media, with a short-lived signed url
 *         button:
 *           type: object
 *           nullable: true
 *           required: [label]
 *           properties:
 *             label:
 *               type: string
 *             link:
 *               type: string
 *               nullable: true
 *         stats:
 *           type: array
 *           items:
 *             type: object
 *             required: [unit, label]
 *             properties:
 *               _id:
 *                 type: string
 *               unit:
 *                 type: string
 *                 example: 200+
 *               label:
 *                 type: string
 *                 example: International Brands
 *     Widget:
 *       description: >
 *         A page widget. The `type` field selects the shape -- `hero` is the
 *         only type so far, and further widget types are added alongside it.
 *       oneOf:
 *         - $ref: '#/components/schemas/HeroWidget'
 *       discriminator:
 *         propertyName: type
 *     Page:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         slug:
 *           type: string
 *           description: Lowercase, hyphen-separated; how the front end addresses the page
 *         status:
 *           type: integer
 *           enum: [0, 1]
 *           description: 0 = draft, 1 = published. Only published pages are served to the public site.
 *         metaTitle:
 *           type: string
 *           nullable: true
 *         metaDescription:
 *           type: string
 *           nullable: true
 *         widgets:
 *           type: array
 *           description: Render order is array order
 *           items:
 *             $ref: '#/components/schemas/Widget'
 *         createdAt:
 *           type: integer
 *           format: int64
 *         updatedAt:
 *           type: integer
 *           format: int64
 */

/**
 * @swagger
 * /api/cms/page:
 *   get:
 *     summary: List pages
 *     tags: [CMS Page]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/PageParam'
 *       - $ref: '#/components/parameters/LimitParam'
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: Filter by 0 = draft, 1 = published. Omit for both.
 *     responses:
 *       200:
 *         description: Page of pages
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Page'
 *                 - $ref: '#/components/schemas/PageMeta'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/WrongScope'
 *   post:
 *     summary: Create a page
 *     tags: [CMS Page]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, slug]
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               status:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 0 = draft (the default for a new page), 1 = published
 *               metaTitle:
 *                 type: string
 *                 nullable: true
 *               metaDescription:
 *                 type: string
 *                 nullable: true
 *               widgets:
 *                 type: array
 *                 description: Widget media fields (a hero's `image`) are sent as media ids
 *                 items:
 *                   $ref: '#/components/schemas/Widget'
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   $ref: '#/components/schemas/Page'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/RefNotFound'
 */

// Only the widget envelope is checked here: each widget's own fields are
// validated against its schema when the document is saved, which keeps the
// rules in one place as widget types are added.
const widgetRules = [
  body('widgets').optional().isArray().withMessage('widgets must be an array'),
  body('widgets.*.type')
    .isIn(WIDGET_TYPES)
    .withMessage(`Each widget needs a type of: ${WIDGET_TYPES.join(', ')}`),
  body('widgets.*.image').optional().isMongoId().withMessage('image must be a valid media id'),
];

const statusRule = body('status')
  .optional()
  .isInt({ min: 0, max: 1 })
  .withMessage('status must be 0 (draft) or 1 (published)')
  .toInt();

const metaRules = [
  body('metaTitle').optional({ values: 'null' }).isString().trim(),
  body('metaDescription').optional({ values: 'null' }).isString().trim(),
];

// A factory rather than a shared chain: `.optional()` mutates the chain it is
// called on, so create and update each need their own.
const slugRule = ({ optional = false } = {}) => {
  const chain = optional ? body('slug').optional() : body('slug');
  return chain
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('slug must be lowercase words separated by hyphens');
};

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
    query('status')
      .optional()
      .isInt({ min: 0, max: 1 })
      .withMessage('status must be 0 (draft) or 1 (published)')
      .toInt(),
  ],
  validate,
  pageController.list
);

router.post(
  '/',
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    slugRule(),
    statusRule,
    ...metaRules,
    ...widgetRules,
  ],
  validate,
  pageController.create
);

/**
 * @swagger
 * /api/cms/page/{id}:
 *   get:
 *     summary: Get a page by id
 *     tags: [CMS Page]
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     parameters:
 *       - $ref: '#/components/parameters/ResourceId'
 *     responses:
 *       200:
 *         description: The page
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   $ref: '#/components/schemas/Page'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *   put:
 *     summary: Update a page
 *     description: >
 *       `widgets` is replaced wholesale when sent -- the array order is the
 *       render order, so send the full list the page should end up with.
 *     tags: [CMS Page]
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
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               status:
 *                 type: integer
 *                 enum: [0, 1]
 *                 description: 0 = draft (the default for a new page), 1 = published
 *               metaTitle:
 *                 type: string
 *                 nullable: true
 *               metaDescription:
 *                 type: string
 *                 nullable: true
 *               widgets:
 *                 type: array
 *                 description: Widget media fields (a hero's `image`) are sent as media ids
 *                 items:
 *                   $ref: '#/components/schemas/Widget'
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 page:
 *                   $ref: '#/components/schemas/Page'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       409:
 *         $ref: '#/components/responses/Conflict'
 *       422:
 *         $ref: '#/components/responses/RefNotFound'
 *   delete:
 *     summary: Permanently delete a page
 *     description: >
 *       Hard delete. Removes the row outright, with no way back -- use the
 *       `PATCH /{id}/delete` soft delete unless the record must genuinely be
 *       purged. Works on already soft-deleted records too.
 *     tags: [CMS Page]
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

router.get('/:id', validateId, pageController.getById);
router.put(
  '/:id',
  validateId,
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    slugRule({ optional: true }),
    statusRule,
    ...metaRules,
    ...widgetRules,
  ],
  validate,
  pageController.update
);

/**
 * @swagger
 * /api/cms/page/{id}/delete:
 *   patch:
 *     summary: Delete a page
 *     description: >
 *       Soft delete. Sets `deleted` to 1 and returns the updated record; the
 *       row is kept but stops appearing in any list or lookup. Deleting an
 *       already-deleted record returns 404, since it is no longer visible.
 *     tags: [CMS Page]
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
 *                 page:
 *                   $ref: '#/components/schemas/Page'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/delete', validateId, pageController.remove);

/**
 * @swagger
 * /api/cms/page/{id}/restore:
 *   patch:
 *     summary: Restore a page
 *     description: >
 *       Undoes a soft delete. Sets `deleted` back to 0 and returns the
 *       record, which shows up in ordinary lists and lookups again. Restoring
 *       a record that is not deleted leaves it as it is.
 *     tags: [CMS Page]
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
 *                 page:
 *                   $ref: '#/components/schemas/Page'
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch('/:id/restore', validateId, pageController.restore);
router.delete('/:id', validateId, pageController.hardDelete);

module.exports = router;
