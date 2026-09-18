const pageService = require('../../services/page.service');

/** The only page endpoint the storefront needs: one page, by slug. */
async function getBySlug(req, res, next) {
  try {
    const page = await pageService.getPageBySlug(req.params.slug);
    res.status(200).json({ page });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBySlug };
