const crypto = require('crypto');
const path = require('path');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Media = require('../models/media.model');
const { getS3Client, getBucket, getSignedUrlTtl } = require('../config/s3');
const ApiError = require('../utils/api-error');
const { readImageDimensions } = require('../utils/image-dimensions');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

function buildKey(file, prefix) {
  const ext = path.extname(file.originalname);
  return `${prefix}/${crypto.randomUUID()}${ext}`;
}

/**
 * Objects are private in S3, so a media record is only useful alongside a
 * short-lived presigned GET URL. Signing is cheap and local (no S3 round trip),
 * so every read path mints a fresh one rather than persisting a stale URL.
 */
async function withSignedUrl(media) {
  const expiresIn = getSignedUrlTtl();
  const url = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: media.bucket, Key: media.key }),
    { expiresIn }
  );

  return {
    ...media.toJSON(),
    url,
    urlExpiresAt: Math.floor(Date.now() / 1000) + expiresIn,
  };
}

async function findMediaOrFail(id) {
  const media = await Media.findById(id);
  if (!media) {
    throw new ApiError(404, 'Media not found');
  }
  return media;
}

async function uploadMedia(file, { prefix = 'uploads' } = {}) {
  const bucket = getBucket();
  const key = buildKey(file, prefix);

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const dimensions = readImageDimensions(file.buffer);

  let media;
  try {
    media = await Media.create({
      key,
      bucket,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      width: dimensions?.width ?? null,
      height: dimensions?.height ?? null,
    });
  } catch (err) {
    // The object is unreachable without a record pointing at it, so clean it
    // up rather than leaving it orphaned in the bucket.
    await getS3Client()
      .send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
      .catch(() => {});
    throw err;
  }

  return withSignedUrl(media);
}

async function listMedia({ page, limit } = {}) {
  const currentPage = Math.max(Number(page) || 1, 1);
  const perPage = Math.min(Math.max(Number(limit) || DEFAULT_LIMIT, 1), MAX_LIMIT);

  const [docs, total] = await Promise.all([
    Media.find()
      .sort({ createdAt: -1 })
      .skip((currentPage - 1) * perPage)
      .limit(perPage),
    Media.countDocuments(),
  ]);

  const items = await Promise.all(docs.map(withSignedUrl));

  return {
    items,
    page: currentPage,
    limit: perPage,
    total,
    totalPages: Math.ceil(total / perPage),
  };
}

async function getMedia(id) {
  const media = await findMediaOrFail(id);
  return withSignedUrl(media);
}

/**
 * Replaces the object's bytes while keeping the same key, so existing
 * references to the media id stay valid. File facts on the record are
 * refreshed from the new upload.
 */
async function updateMedia(id, file) {
  const media = await findMediaOrFail(id);

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: media.bucket,
      Key: media.key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  const dimensions = readImageDimensions(file.buffer);

  media.originalName = file.originalname;
  media.mimetype = file.mimetype;
  media.size = file.size;
  // Always reassign, so replacing an image with a differently sized one (or
  // with a non-image) never leaves the previous dimensions behind.
  media.width = dimensions?.width ?? null;
  media.height = dimensions?.height ?? null;
  await media.save();

  return withSignedUrl(media);
}

/**
 * Proxies the object's bytes through the server for callers that want a plain
 * URL they can point an <img>/<video> at instead of handling a signed URL.
 * Range is passed straight through to S3 so clients can seek.
 */
async function streamMedia(id, { range } = {}) {
  const media = await findMediaOrFail(id);

  let result;
  try {
    result = await getS3Client().send(
      new GetObjectCommand({ Bucket: media.bucket, Key: media.key, Range: range })
    );
  } catch (err) {
    const status = err.$metadata?.httpStatusCode;
    if (err.name === 'InvalidRange' || status === 416) {
      throw new ApiError(416, 'Requested range not satisfiable');
    }
    // Without s3:ListBucket, S3 reports a missing key as 403 AccessDenied
    // rather than NoSuchKey, so both collapse to "not found" for the caller.
    // The real cause is logged so a genuine policy misconfiguration is still
    // diagnosable, and AWS error text (account id, IAM ARN) never reaches the client.
    if (err.name === 'NoSuchKey' || status === 404 || status === 403) {
      console.error(`S3 GetObject failed for ${media.bucket}/${media.key}:`, err.message);
      throw new ApiError(404, 'Media file not found');
    }
    throw err;
  }

  return {
    body: result.Body,
    contentType: result.ContentType || media.mimetype,
    contentLength: result.ContentLength,
    contentRange: result.ContentRange,
    fileName: media.originalName,
  };
}

async function deleteMedia(id) {
  const media = await findMediaOrFail(id);

  // S3 DeleteObject is idempotent, so a missing object still resolves.
  await getS3Client().send(new DeleteObjectCommand({ Bucket: media.bucket, Key: media.key }));
  await media.deleteOne();
}

module.exports = { uploadMedia, listMedia, getMedia, streamMedia, updateMedia, deleteMedia };
