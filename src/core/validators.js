const { param, query } = require('express-validator');
const validate = require('./middlewares/validate.middleware');
const { MAX_LIMIT } = require('./paginate');

/**
 * Rules for the `page` / `limit` query params every list endpoint accepts.
 * A function rather than a shared array: express-validator chains are
 * mutable, so each route gets its own.
 */
function paginationRules() {
  return [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: MAX_LIMIT })
      .withMessage(`limit must be 1-${MAX_LIMIT}`),
  ];
}

/** Rejects a request whose `:id` route param is not a Mongo ObjectId. */
function validateId(message = 'A valid id is required') {
  return [param('id').isMongoId().withMessage(message), validate];
}

module.exports = { paginationRules, validateId };
