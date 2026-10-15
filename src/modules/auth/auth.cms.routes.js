const express = require('express');
const { body } = require('express-validator');
const validate = require('../../core/middlewares/validate.middleware');
const authController = require('./auth.controller');
const requireAuth = require('./auth.middleware');

// Docs: auth.docs.yaml. There is deliberately no CMS signup: admin accounts
// are promoted from regular ones, never self-registered.
const router = express.Router();

router.post(
  '/signin',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.signin('cms')
);

router.get('/profile', requireAuth('cms'), authController.profile);

router.post('/signout', authController.signout('cms'));

module.exports = router;
