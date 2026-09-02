const crypto = require('crypto');
const path = require('path');
const { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const Media = require('../models/media.model');
const { getS3Client, getBucket, getSignedUrlTtl } = require('../config/s3');
const ApiError = require('../utils/api-error');
const { readImageDimensions } = require('../utils/image-dimensions');
const { paginationFrom, pageMeta } = require('../utils/paginate');

function buildKey(file, prefix) {
  const ext = path.extname(file.originalname);
  return `${prefix}/${crypto.randomUUID()}${ext}`;
}

/**
 * Attaches a short-lived presigned GET URL to a serialised Media object.
 * Objects are private in S3, so a media record is only useful alongside one.
 * Signing is local and cheap (no S3 round trip), so every read path mints a
 * fresh URL rather than persisting one that would go stale.
 *
 * Passes through anything that is not a populated media object -- null, or a
 * bare ObjectId -- so callers can hand it an unpopulated ref safely.
 */
async function attachSignedUrl(media) {
  if (!media || typeof media !== 'object' || !media.key) {
    return media;
  }

  const expiresIn = getSignedUrlTtl();
  const url = await getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: media.bucket, Key: media.key }),
    { expiresIn }
  );

  return {
    ...media,
    url,
    urlExpiresAt: Math.floor(Date.now() / 1000) + expiresIn,
  };
}

function withSignedUrl(media) {
  return attachSignedUrl(media.toJSON());
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

async function listMedia(query = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const [docs, total] = await Promise.all([
    Media.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Media.countDocuments(),
  ]);

  const items = await Promise.all(docs.map(withSignedUrl));

  return { items, ...pageMeta({ page, limit, total }) };
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

module.exports = {
  uploadMedia,
  listMedia,
  getMedia,
  streamMedia,
  updateMedia,
  deleteMedia,
  attachSignedUrl,
};
