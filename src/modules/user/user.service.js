const createCrudService = require('../../core/crud/crud.service');
const User = require('../auth/user.model');

// Read-only for now: accounts are created through auth signup, so nothing
// here is writable. Passwords never leave the model (select: false + toJSON).
module.exports = createCrudService(User, {
  fields: [],
  populate: ['role'],
});
