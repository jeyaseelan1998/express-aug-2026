const styleService = require('../../services/style.service');

async function list(req, res, next) {
  try {
    // The CMS surface lists soft-deleted records too, so they can be seen and purged.
    const result = await styleService.listStyles(req.query, { withDeleted: req.isCmsSurface });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const style = await styleService.getStyle(req.params.id);
    res.status(200).json({ style });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const style = await styleService.createStyle(req.body);
    res.status(201).json({ style });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const style = await styleService.updateStyle(req.params.id, req.body);
    res.status(200).json({ style });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const style = await styleService.deleteStyle(req.params.id);
    res.status(200).json({ style });
  } catch (err) {
    next(err);
  }
}

// Permanent: the row is gone afterwards, so nothing is returned.
async function hardDelete(req, res, next) {
  try {
    await styleService.hardDeleteStyle(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove, hardDelete };
