const { body, query } = require('express-validator');
const createCrudRouter = require('../../core/crud/crud.router');
const pageService = require('./page.service');
const { WIDGET_TYPES } = require('./widgets');

// Rule groups are factories: express-validator chains are mutable, so create
// and update each need their own.

// Only the widget envelope is checked here: each widget's own fields are
// validated against its schema when the document is saved, which keeps the
// rules in one place as widget types are added.
const widgetRules = () => [
  body('widgets').optional().isArray().withMessage('widgets must be an array'),
  body('widgets.*.type')
    .isIn(WIDGET_TYPES)
    .withMessage(`Each widget needs a type of: ${WIDGET_TYPES.join(', ')}`),
  body('widgets.*.image').optional().isMongoId().withMessage('image must be a valid media id'),
  body('widgets.*.brands').optional().isArray().withMessage('brands must be an array'),
  body('widgets.*.brands.*').isMongoId().withMessage('brands must be valid brand ids'),
];

const statusRule = () =>
  body('status')
    .optional()
    .isInt({ min: 0, max: 1 })
    .withMessage('status must be 0 (draft) or 1 (published)')
    .toInt();

const metaRules = () => [
  body('metaTitle').optional({ values: 'null' }).isString().trim(),
  body('metaDescription').optional({ values: 'null' }).isString().trim(),
  body('keywords').optional().isArray().withMessage('keywords must be an array'),
  body('keywords.*').optional().isString().trim().notEmpty(),
  body('ogImage')
    .optional({ values: 'null' })
    .isMongoId()
    .withMessage('ogImage must be a media id'),
];

const slugRule = ({ optional = false } = {}) => {
  const chain = optional ? body('slug').optional() : body('slug');
  return chain
    .trim()
    .toLowerCase()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('slug must be lowercase words separated by hyphens');
};

// Docs: page.docs.yaml
module.exports = createCrudRouter({
  service: pageService,
  key: 'page',
  rules: {
    list: [
      query('status')
        .optional()
        .isInt({ min: 0, max: 1 })
        .withMessage('status must be 0 (draft) or 1 (published)')
        .toInt(),
    ],
    create: [
      body('title').trim().notEmpty().withMessage('Title is required'),
      slugRule(),
      statusRule(),
      ...metaRules(),
      ...widgetRules(),
    ],
    update: [
      body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
      slugRule({ optional: true }),
      statusRule(),
      ...metaRules(),
      ...widgetRules(),
    ],
  },
});
