const express = require('express');
const { param, query } = require('express-validator');
const mediaController = require('../controllers/media.controller');
const upload = require('../middlewares/upload.middleware');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Media record id, used by all read/update/delete routes
 *         key:
 *           type: string
 *           description: The S3 object key
 *         bucket:
 *           type: string
 *         originalName:
 *           type: string
 *         mimetype:
 *           type: string
 *         size:
 *           type: integer
 *         url:
 *           type: string
 *           description: >
 *             Short-lived presigned GET URL. Objects are private in S3, so this
 *             is minted fresh on every read and expires at urlExpiresAt.
 *         urlExpiresAt:
 *           type: integer
 *           format: int64
 *           description: Unix timestamp (seconds) at which url stops working
 *         createdAt:
 *           type: integer
 *           format: int64
 *           description: Unix timestamp (seconds)
 *         updatedAt:
 *           type: integer
 *           format: int64
 *           description: Unix timestamp (seconds)
 *     MediaList:
 *       type: object
 *       properties:
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Media'
 *         page:
 *           type: integer
 *         limit:
 *           type: integer
 *         total:
 *           type: integer
 *         totalPages:
 *           type: integer
 */

/**
 * @swagger
 * /api/web/media:
 *   post:
 *     summary: Upload a media file
 *     description: Stores the file in S3 and creates a Media record pointing at it.
 *     tags: [Web Media]
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
 *         description: File uploaded and record created
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
 *     summary: List media records
 *     description: Paginates the Media collection, newest first.
 *     tags: [Web Media]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Page of media records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MediaList'
 *
 * /api/cms/media:
 *   post:
 *     summary: Upload a media file
 *     description: Stores the file in S3 and creates a Media record pointing at it.
 *     tags: [CMS Media]
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
 *         description: File uploaded and record created
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
 *     summary: List media records
 *     description: Paginates the Media collection, newest first.
 *     tags: [CMS Media]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Page of media records
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MediaList'
 */
router.post('/', upload.single('file'), mediaController.upload);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be 1-100'),
  ],
  validate,
  mediaController.list
);

const validateId = [param('id').isMongoId().withMessage('A valid media id is required'), validate];

/**
 * @swagger
 * /api/web/media/{id}:
 *   get:
 *     summary: Get a media record with a signed download URL
 *     description: >
 *       Looks up the Media record and returns it with a freshly signed,
 *       short-lived S3 GET URL. The object itself is private, so the client
 *       must use the returned url before urlExpiresAt.
 *     tags: [Web Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Media record id
 *     responses:
 *       200:
 *         description: Media record with signed URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       400:
 *         description: Invalid media id
 *       404:
 *         description: Media not found
 *   put:
 *     summary: Replace an existing media file's content
 *     description: >
 *       Overwrites the object's bytes at the same S3 key, so the media id and
 *       key stay stable, and refreshes originalName, mimetype and size.
 *     tags: [Web Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Media record id
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
 *       400:
 *         description: Invalid media id or no file provided
 *       404:
 *         description: Media not found
 *   delete:
 *     summary: Delete a media file and its record
 *     tags: [Web Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Media record id
 *     responses:
 *       204:
 *         description: File and record deleted
 *       400:
 *         description: Invalid media id
 *       404:
 *         description: Media not found
 *
 * /api/cms/media/{id}:
 *   get:
 *     summary: Get a media record with a signed download URL
 *     description: >
 *       Looks up the Media record and returns it with a freshly signed,
 *       short-lived S3 GET URL. The object itself is private, so the client
 *       must use the returned url before urlExpiresAt.
 *     tags: [CMS Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Media record id
 *     responses:
 *       200:
 *         description: Media record with signed URL
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       400:
 *         description: Invalid media id
 *       404:
 *         description: Media not found
 *   put:
 *     summary: Replace an existing media file's content
 *     description: >
 *       Overwrites the object's bytes at the same S3 key, so the media id and
 *       key stay stable, and refreshes originalName, mimetype and size.
 *     tags: [CMS Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Media record id
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
 *       400:
 *         description: Invalid media id or no file provided
 *       404:
 *         description: Media not found
 *   delete:
 *     summary: Delete a media file and its record
 *     tags: [CMS Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Media record id
 *     responses:
 *       204:
 *         description: File and record deleted
 *       400:
 *         description: Invalid media id
 *       404:
 *         description: Media not found
 */
router.get('/:id', validateId, mediaController.getById);
router.put('/:id', validateId, upload.single('file'), mediaController.update);
router.delete('/:id', validateId, mediaController.remove);

/**
 * @swagger
 * /api/web/media/{id}/stream:
 *   get:
 *     summary: Stream a media file's bytes through the server
 *     description: >
 *       Resolves the Media record, then proxies the private S3 object's bytes
 *       in the response. Unlike GET /media/{id}, the caller needs no signed
 *       URL, so this suits <img>/<video> src attributes directly. Supports
 *       HTTP Range requests for seeking.
 *     tags: [Web Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Media record id
 *       - in: header
 *         name: Range
 *         required: false
 *         schema:
 *           type: string
 *         description: Standard byte range, e.g. `bytes=0-1023`
 *     responses:
 *       200:
 *         description: Full file contents
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial contents, when a Range header was sent
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid media id
 *       404:
 *         description: Media record or underlying file not found
 *       416:
 *         description: Requested range not satisfiable
 *
 * /api/cms/media/{id}/stream:
 *   get:
 *     summary: Stream a media file's bytes through the server
 *     description: >
 *       Resolves the Media record, then proxies the private S3 object's bytes
 *       in the response. Unlike GET /media/{id}, the caller needs no signed
 *       URL, so this suits <img>/<video> src attributes directly. Supports
 *       HTTP Range requests for seeking.
 *     tags: [CMS Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The Media record id
 *       - in: header
 *         name: Range
 *         required: false
 *         schema:
 *           type: string
 *         description: Standard byte range, e.g. `bytes=0-1023`
 *     responses:
 *       200:
 *         description: Full file contents
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       206:
 *         description: Partial contents, when a Range header was sent
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invalid media id
 *       404:
 *         description: Media record or underlying file not found
 *       416:
 *         description: Requested range not satisfiable
 */
router.get('/:id/stream', validateId, mediaController.stream);

module.exports = router;
