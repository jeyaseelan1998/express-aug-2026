const { query } = require('express-validator');
const { LIST_TYPES } = require('./product.service');

/** `?type=` picks the list order, e.g. new arrivals; shared by the CMS and web lists. */
const listTypeRules = () => [
  query('type')
    .optional()
    .isIn(LIST_TYPES)
    .withMessage(`type must be one of: ${LIST_TYPES.join(', ')}`),
];

module.exports = { listTypeRules };
