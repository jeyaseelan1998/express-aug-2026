const multer = require('multer');
const { getMaxUploadBytes } = require('../config/s3');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: getMaxUploadBytes() },
});

module.exports = upload;
