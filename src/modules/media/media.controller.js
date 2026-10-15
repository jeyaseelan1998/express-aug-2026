const ApiError = require('../../core/api-error');
const asyncHandler = require('../../core/async-handler');
const mediaService = require('./media.service');

const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file provided');
  }
  const media = await mediaService.uploadMedia(req.file);
  res.status(201).json({ media });
});

const list = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;
  // The CMS surface lists soft-deleted records too, so they can be seen and purged.
  const result = await mediaService.listMedia({ page, limit }, { withDeleted: req.withDeleted });
  res.status(200).json(result);
});

const getById = asyncHandler(async (req, res) => {
  const media = await mediaService.getMedia(req.params.id);
  res.status(200).json({ media });
});

const stream = asyncHandler(async (req, res) => {
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
});

const update = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file provided');
  }
  const media = await mediaService.updateMedia(req.params.id, req.file);
  res.status(200).json({ media });
});

const remove = asyncHandler(async (req, res) => {
  const media = await mediaService.deleteMedia(req.params.id);
  res.status(200).json({ media });
});

// Permanent: the row is gone afterwards, so nothing is returned.
const hardDelete = asyncHandler(async (req, res) => {
  await mediaService.hardDeleteMedia(req.params.id);
  res.status(204).send();
});

module.exports = { upload, list, getById, stream, update, remove, hardDelete };
