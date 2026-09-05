const express = require('express');
const { body } = require('express-validator');
const authController = require('../../controllers/cms/auth.controller');
const validate = require('../../middlewares/validate.middleware');
const requireAuth = require('../../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * /api/cms/auth/signin:
 *   post:
 *     summary: Sign in to the CMS (admin accounts only)
 *     tags: [CMS Auth]
 *     parameters:
 *       - in: header
 *         name: X-Client-Type
 *         schema:
 *           type: string
 *           enum: [web, mobile]
 *         description: >
 *           'web' sets an httpOnly cms_token cookie and omits the token from
 *           the response body. Any other value (or omitted) returns the
 *           token in the response body instead.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: >
 *           Signed in successfully. When X-Client-Type is 'web', the token
 *           is set as an httpOnly cms_token cookie and the body contains
 *           only `user`. Otherwise the body matches AuthResponse.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: User exists but is not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/signin',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.signin
);

/**
 * @swagger
 * /api/cms/auth/profile:
 *   get:
 *     summary: Get the signed-in CMS user's details
 *     tags: [CMS Auth]
 *     description: >
 *       Reads the token from the `Authorization: Bearer` header when present,
 *       otherwise from the httpOnly `cms_token` cookie set for X-Client-Type
 *       'web' clients.
 *     security: [{ bearerAuth: [] }, { cmsCookie: [] }]
 *     responses:
 *       200:
 *         description: The signed-in user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/WrongScope'
 */
router.get('/profile', requireAuth('cms'), authController.profile);

module.exports = router;
