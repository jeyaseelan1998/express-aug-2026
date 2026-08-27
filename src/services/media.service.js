const crypto = require('crypto');
const path = require('path');
const {
  PutObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');
const { getS3Client, getBucket } = require('../config/s3');
const ApiError = require('../utils/api-error');

function buildUrl(key) {
  const bucket = getBucket();
  const region = process.env.AWS_REGION;
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

async function objectExists(key) {
  try {
    await getS3Client().send(new HeadObjectCommand({ Bucket: getBucket(), Key: key }));
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

async function uploadMedia(file, { prefix = 'uploads' } = {}) {
  const ext = path.extname(file.originalname);
  const key = `${prefix}/${crypto.randomUUID()}${ext}`;

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: buildUrl(key),
    size: file.size,
    mimetype: file.mimetype,
  };
}

async function listMedia({ prefix, continuationToken, maxKeys } = {}) {
  const result = await getS3Client().send(
    new ListObjectsV2Command({
      Bucket: getBucket(),
      Prefix: prefix,
      ContinuationToken: continuationToken,
      MaxKeys: maxKeys ? Number(maxKeys) : undefined,
    })
  );

  const items = (result.Contents || []).map((obj) => ({
    key: obj.Key,
    url: buildUrl(obj.Key),
    size: obj.Size,
    lastModified: obj.LastModified,
  }));

  return {
    items,
    isTruncated: result.IsTruncated || false,
    nextContinuationToken: result.NextContinuationToken || null,
  };
}

async function deleteMedia(key) {
  if (!(await objectExists(key))) {
    throw new ApiError(404, 'Media not found');
  }

  await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
}

async function updateMedia(key, file) {
  if (!(await objectExists(key))) {
    throw new ApiError(404, 'Media not found');
  }

  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    })
  );

  return {
    key,
    url: buildUrl(key),
    size: file.size,
    mimetype: file.mimetype,
  };
}

module.exports = { uploadMedia, listMedia, deleteMedia, updateMedia };
