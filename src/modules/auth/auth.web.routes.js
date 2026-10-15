const express = require('express');
const { body } = require('express-validator');
const validate = require('../../core/middlewares/validate.middleware');
const authController = require('./auth.controller');
const requireAuth = require('./auth.middleware');

// Docs: auth.docs.yaml
const router = express.Router();

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

router.post(
  '/signin',
  [
    body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.signin('web')
);

router.get('/profile', requireAuth('web'), authController.profile);

router.post('/signout', authController.signout('web'));

module.exports = router;
