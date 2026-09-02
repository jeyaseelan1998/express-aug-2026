const brandService = require('../../services/brand.service');

async function list(req, res, next) {
  try {
    const result = await brandService.listBrands(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const brand = await brandService.getBrand(req.params.id);
    res.status(200).json({ brand });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const brand = await brandService.createBrand(req.body);
    res.status(201).json({ brand });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const brand = await brandService.updateBrand(req.params.id, req.body);
    res.status(200).json({ brand });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await brandService.deleteBrand(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
