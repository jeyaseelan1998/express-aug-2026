const express = require('express');
const { body } = require('express-validator');
const ApiError = require('../../core/api-error');
const asyncHandler = require('../../core/async-handler');
const createCrudRouter = require('../../core/crud/crud.router');
const validate = require('../../core/middlewares/validate.middleware');
const { paginationRules, validateId } = require('../../core/validators');
const userService = require('./user.service');

const roleRule = () =>
  body('role').optional().isMongoId().withMessage('role must be a valid role id');

/** Deleting your own account would end your session and lock you out. */
function notSelf(req, _res, next) {
  if (req.user && String(req.user.id) === req.params.id) {
    return next(new ApiError(400, 'You cannot delete your own account'));
  }
  next();
}

// Docs: user.docs.yaml
const router = express.Router();

router.get(
  '/:id/login-history',
  validateId(),
  paginationRules(),
  validate,
  asyncHandler(async (req, res) => {
    res.status(200).json(await userService.getLoginHistory(req.params.id, req.query));
  })
);

router.patch('/:id/delete', notSelf);
router.delete('/:id', notSelf);

router.use(
  createCrudRouter({
    service: userService,
    key: 'user',
    rules: {
      create: [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
        body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
        roleRule(),
      ],
      update: [
        body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
        body('email')
          .optional()
          .isEmail()
          .withMessage('A valid email is required')
          .normalizeEmail(),
        body('password')
          .optional()
          .isLength({ min: 8 })
          .withMessage('Password must be at least 8 characters'),
        roleRule(),
      ],
    },
  })
);

module.exports = router;
