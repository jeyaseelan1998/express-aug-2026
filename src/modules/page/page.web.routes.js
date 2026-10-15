const express = require('express');
const { param } = require('express-validator');
const validate = require('../../core/middlewares/validate.middleware');
const pageController = require('./page.controller');

// Docs: page.docs.yaml
const router = express.Router();

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
