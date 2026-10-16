const createCrudService = require('../../core/crud/crud.service');
const Role = require('../auth/role.model');

// Read-only: roles are seeded (see auth/seed-roles.js), not edited in the CMS.
module.exports = createCrudService(Role, { fields: [] });
