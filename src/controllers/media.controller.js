const mediaService = require('../services/media.service');
const ApiError = require('../utils/api-error');

async function upload(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file provided');
    }
    const media = await mediaService.uploadMedia(req.file);
    res.status(201).json({ media });
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const { prefix, continuationToken, maxKeys } = req.query;
    const result = await mediaService.listMedia({ prefix, continuationToken, maxKeys });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file provided');
    }
    const key = req.params[0];
    const media = await mediaService.updateMedia(key, req.file);
    res.status(200).json({ media });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const key = req.params[0];
    await mediaService.deleteMedia(key);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, update, remove };
