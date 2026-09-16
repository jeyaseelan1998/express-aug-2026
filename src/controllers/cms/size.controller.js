const sizeService = require('../../services/size.service');

async function list(req, res, next) {
  try {
    // The CMS surface lists soft-deleted records too, so they can be seen and purged.
    const result = await sizeService.listSizes(req.query, { withDeleted: req.isCmsSurface });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const size = await sizeService.getSize(req.params.id);
    res.status(200).json({ size });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const size = await sizeService.createSize(req.body);
    res.status(201).json({ size });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const size = await sizeService.updateSize(req.params.id, req.body);
    res.status(200).json({ size });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const size = await sizeService.deleteSize(req.params.id);
    res.status(200).json({ size });
  } catch (err) {
    next(err);
  }
}

async function restore(req, res, next) {
  try {
    const size = await sizeService.restoreSize(req.params.id);
    res.status(200).json({ size });
  } catch (err) {
    next(err);
  }
}

// Permanent: the row is gone afterwards, so nothing is returned.
async function hardDelete(req, res, next) {
  try {
    await sizeService.hardDeleteSize(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, restore, hardDelete };
