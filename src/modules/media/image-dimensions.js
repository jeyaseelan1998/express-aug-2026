const { imageSize, disableTypes, types } = require('image-size');

/**
 * Formats we are willing to parse. image-size 2.0.2 is the latest release and
 * still carries GHSA-w3rx-r6r6-pgpr and GHSA-5p2g-fcmc-qvqq -- infinite loops
 * in the ICNS, JXL and HEIF parsers -- with no fixed version available. Upload
 * buffers are attacker-controlled, so every parser we do not need is switched
 * off, which covers those three and any future hole in an exotic format.
 */
const ALLOWED_TYPES = ['png', 'jpg', 'gif', 'webp', 'bmp', 'tiff', 'ico', 'svg'];

disableTypes(types.filter((type) => !ALLOWED_TYPES.includes(type)));

/**
 * Reads pixel dimensions from an upload buffer, or null when the bytes are not
 * a supported image. Detection is by file header rather than by the mimetype
 * the client claimed, so a mislabelled upload is still measured correctly and
 * a non-image simply yields null.
 */
function readImageDimensions(buffer) {
  try {
    const { width, height } = imageSize(buffer);
    if (Number.isFinite(width) && Number.isFinite(height)) {
      return { width, height };
    }
    return null;
  } catch {
    // Unrecognised, truncated or disabled format: not fatal, just unmeasurable.
    return null;
  }
}

module.exports = { readImageDimensions, ALLOWED_TYPES };
