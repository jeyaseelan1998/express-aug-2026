const pageService = require('../../services/page.service');

async function list(req, res, next) {
  try {
    // The CMS surface lists soft-deleted records too, so they can be seen and purged.
    const result = await pageService.listPages(req.query, { withDeleted: req.isCmsSurface });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const page = await pageService.getPage(req.params.id);
    res.status(200).json({ page });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const page = await pageService.createPage(req.body);
    res.status(201).json({ page });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const page = await pageService.updatePage(req.params.id, req.body);
    res.status(200).json({ page });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const page = await pageService.deletePage(req.params.id);
    res.status(200).json({ page });
  } catch (err) {
    next(err);
  }
}

async function restore(req, res, next) {
  try {
    const page = await pageService.restorePage(req.params.id);
    res.status(200).json({ page });
  } catch (err) {
    next(err);
  }
}

// Permanent: the row is gone afterwards, so nothing is returned.
async function hardDelete(req, res, next) {
  try {
    await pageService.hardDeletePage(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, restore, hardDelete };
