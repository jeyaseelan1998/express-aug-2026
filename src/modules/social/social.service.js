const createCrudService = require('../../core/crud/crud.service');
const Color = require('../color/color.model');
const Social = require('./social.model');

module.exports = createCrudService(Social, {
  label: 'Social link',
  fields: ['name', 'link', 'icon', 'background'],
  populate: ['background'],
  refs: { background: Color },
});
