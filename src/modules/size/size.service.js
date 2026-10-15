const createCrudService = require('../../core/crud/crud.service');
const Size = require('./size.model');

module.exports = createCrudService(Size, {
  fields: ['name'],
});
