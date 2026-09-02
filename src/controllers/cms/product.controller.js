const productService = require('../../services/product.service');

async function list(req, res, next) {
  try {
    const result = await productService.listProducts(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const product = await productService.getProduct(req.params.id);
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ product });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ product });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await productService.deleteProduct(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
