const express = require('express');
const { body } = require('express-validator');
const authController = require('../../controllers/web/auth.controller');
const validate = require('../../middlewares/validate.middleware');
const requireAuth = require('../../middlewares/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *               enum: [user, admin, superadmin]
 *             permissions:
 *               type: array
 *               items:
 *                 type: string
 *         createdAt:
 *           type: integer
 *           format: int64
 *           description: Unix timestamp (seconds)
 *         updatedAt:
 *           type: integer
 *           format: int64
 *           description: Unix timestamp (seconds)
 *     AuthResponse:
 *       type: object
 *       properties:
 *         user:
 *           $ref: '#/components/schemas/User'
 *         token:
 *           type: string
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

/**
 * @swagger
 * /api/web/auth/signup:
 *   post:
 *     summary: Create a new user account
 *     tags: [Web Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jeya
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jeya@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created
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
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  authController.signup
);

/**
 * @swagger
 * /api/web/auth/signin:
 *   post:
 *     summary: Sign in with email and password
 *     tags: [Web Auth]
 *     parameters:
 *       - in: header
 *         name: X-Client-Type
 *         schema:
 *           type: string
 *           enum: [web, mobile]
 *         description: >
 *           'web' sets an httpOnly auth cookie and omits the token from the
 *           response body. Any other value (or omitted) returns the token
 *           in the response body instead, for mobile/non-browser clients.
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
 *                 example: jeya@test.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: password123
 *     responses:
 *       200:
 *         description: >
 *           Signed in successfully. When X-Client-Type is 'web', the token
 *           is set as an httpOnly cookie and the body contains only `user`.
 *           Otherwise the body matches AuthResponse (includes `token`).
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
 * /api/web/auth/profile:
 *   get:
 *     summary: Get the signed-in user's details
 *     tags: [Web Auth]
 *     description: >
 *       Reads the token from the `Authorization: Bearer` header when present,
 *       otherwise from the httpOnly `web_token` cookie set for X-Client-Type
 *       'web' clients.
 *     security: [{ bearerAuth: [] }, { webCookie: [] }]
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
 *         description: Token is valid but not a web session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/profile', requireAuth('web'), authController.profile);

module.exports = router;
