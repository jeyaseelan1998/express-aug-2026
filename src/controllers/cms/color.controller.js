const colorService = require('../../services/color.service');

async function list(req, res, next) {
  try {
    const result = await colorService.listColors(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const color = await colorService.getColor(req.params.id);
    res.status(200).json({ color });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const color = await colorService.createColor(req.body);
    res.status(201).json({ color });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const color = await colorService.updateColor(req.params.id, req.body);
    res.status(200).json({ color });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await colorService.deleteColor(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
