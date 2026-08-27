const express = require('express');
const mediaController = require('../controllers/media.controller');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       properties:
 *         key:
 *           type: string
 *         url:
 *           type: string
 *         size:
 *           type: integer
 *         mimetype:
 *           type: string
 */

/**
 * @swagger
 * /api/{scope}/media:
 *   post:
 *     summary: Upload a media file
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web, cms]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: File uploaded
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       400:
 *         description: No file provided or file too large
 *   get:
 *     summary: List media files
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web, cms]
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *       - in: query
 *         name: continuationToken
 *         schema:
 *           type: string
 *       - in: query
 *         name: maxKeys
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of media files
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 items:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Media'
 *                 isTruncated:
 *                   type: boolean
 *                 nextContinuationToken:
 *                   type: string
 *                   nullable: true
 */
router.post('/', upload.single('file'), mediaController.upload);
router.get('/', mediaController.list);

/**
 * @swagger
 * /api/{scope}/media/{key}:
 *   put:
 *     summary: Replace an existing media file's content
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web, cms]
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The S3 object key (may contain slashes)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         description: Media not found
 *   delete:
 *     summary: Delete a media file
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: scope
 *         required: true
 *         schema:
 *           type: string
 *           enum: [web, cms]
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: The S3 object key (may contain slashes)
 *     responses:
 *       204:
 *         description: File deleted
 *       404:
 *         description: Media not found
 */
router.put('/*', upload.single('file'), mediaController.update);
router.delete('/*', mediaController.remove);

module.exports = router;
