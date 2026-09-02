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
    const { page, limit } = req.query;
    const result = await mediaService.listMedia({ page, limit });
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const media = await mediaService.getMedia(req.params.id);
    res.status(200).json({ media });
  } catch (err) {
    next(err);
  }
}

async function stream(req, res, next) {
  try {
    const { body, contentType, contentLength, contentRange, fileName } =
      await mediaService.streamMedia(req.params.id, { range: req.headers.range });

    res.status(contentRange ? 206 : 200);
    res.set({
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    });
    if (contentLength !== undefined) res.set('Content-Length', String(contentLength));
    if (contentRange) res.set('Content-Range', contentRange);

    // Stop pulling from S3 if the client goes away mid-download.
    res.on('close', () => body.destroy());

    // Headers are already out by the time the body errors, so the error
    // handler can no longer render JSON; drop the connection instead.
    body.on('error', () => res.destroy());

    body.pipe(res);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    if (!req.file) {
      throw new ApiError(400, 'No file provided');
    }
    const media = await mediaService.updateMedia(req.params.id, req.file);
    res.status(200).json({ media });
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    await mediaService.deleteMedia(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { upload, list, getById, stream, update, remove };
