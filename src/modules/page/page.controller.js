const asyncHandler = require('../../core/async-handler');
const pageService = require('./page.service');

/** The only page endpoint the storefront needs: one page, by slug. */
const getBySlug = asyncHandler(async (req, res) => {
  const page = await pageService.getBySlug(req.params.slug);
  res.status(200).json({ page });
});

module.exports = { getBySlug };
