const categoryService = require('../../services/category.service');

async function list(req, res, next) {
  try {
    // The CMS surface lists soft-deleted records too, so they can be seen and purged.
    const result = await categoryService.listCategories(req.query, {
      withDeleted: req.isCmsSurface,
    });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const category = await categoryService.getCategory(req.params.id);
    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const category = await categoryService.updateCategory(req.params.id, req.body);
    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const category = await categoryService.deleteCategory(req.params.id);
    res.status(200).json({ category });
  } catch (err) {
    next(err);
  }
}

// Permanent: the row is gone afterwards, so nothing is returned.
async function hardDelete(req, res, next) {
  try {
    await categoryService.hardDeleteCategory(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, hardDelete };
