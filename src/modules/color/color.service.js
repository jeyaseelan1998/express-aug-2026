const createCrudService = require('../../core/crud/crud.service');
const Color = require('./color.model');

module.exports = createCrudService(Color, {
  fields: ['name', 'code', 'keywords'],
});
