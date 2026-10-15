const createCrudService = require('../../core/crud/crud.service');
const Category = require('./category.model');

module.exports = createCrudService(Category, {
  fields: ['name'],
});
