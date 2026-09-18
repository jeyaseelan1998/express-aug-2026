const express = require('express');
const { param } = require('express-validator');
const pageController = require('../../controllers/web/page.controller');
const validate = require('../../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/web/page/{slug}:
 *   get:
 *     summary: Get a page by slug
 *     description: >
 *       Page details, with the widgets in render order. Public: no session is
 *       needed. Only published pages are served -- a draft or soft-deleted
 *       page answers 404, so an unpublished slug gives nothing away.
 *     tags: [Web Page]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Lowercase, hyphen-separated page slug
 *         example: home
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
 *       400:
 *         $ref: '#/components/responses/ValidationFailed'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get(
  '/:slug',
  [
    param('slug')
      .trim()
      .toLowerCase()
      .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .withMessage('A valid slug is required'),
    validate,
  ],
  pageController.getBySlug
);

module.exports = router;
