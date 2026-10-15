const createCrudService = require('../../core/crud/crud.service');
const Media = require('../media/media.model');
const { signMediaPaths } = require('../media/media.service');
const Brand = require('./brand.model');

module.exports = createCrudService(Brand, {
  fields: ['name', 'image'],
  populate: ['image'],
  refs: { image: Media },
  // The image ref is populated, then signed so a CMS can render it directly.
  serialize: (doc) => signMediaPaths(doc.toJSON(), ['image']),
});
