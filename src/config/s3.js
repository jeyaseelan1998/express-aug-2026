const { S3Client } = require('@aws-sdk/client-s3');

let client;

function getS3Client() {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

function getBucket() {
  const bucket = process.env.AWS_S3_BUCKET;
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET is not set');
  }
  return bucket;
}

function getMaxUploadBytes() {
  const mb = Number(process.env.AWS_MAX_UPLOAD_SIZE) || 5;
  return mb * 1024 * 1024;
}

function assertConfigured() {
  const required = ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_S3_BUCKET'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) {
    throw new Error(`Missing required S3 env vars: ${missing.join(', ')}`);
  }
}

module.exports = { getS3Client, getBucket, getMaxUploadBytes, assertConfigured };
