const createCrudService = require('../../core/crud/crud.service');
const Media = require('../media/media.model');
const { signMediaPaths } = require('../media/media.service');
const Style = require('./style.model');

module.exports = createCrudService(Style, {
  fields: ['name', 'image'],
  populate: ['image'],
  refs: { image: Media },
  // The image ref is populated, then signed so a CMS can render it directly.
  serialize: (doc) => signMediaPaths(doc.toJSON(), ['image']),
});
