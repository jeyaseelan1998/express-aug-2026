const socialService = require('../../services/social.service');

async function list(req, res, next) {
  try {
    const result = await socialService.listSocials(req.query);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const social = await socialService.getSocial(req.params.id);
    res.status(200).json({ social });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const social = await socialService.createSocial(req.body);
    res.status(201).json({ social });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const social = await socialService.updateSocial(req.params.id, req.body);
    res.status(200).json({ social });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await socialService.deleteSocial(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
