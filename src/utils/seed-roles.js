const Role = require('../models/role.model');

const ROLE_NAMES = ['user', 'admin', 'superadmin'];

async function seedRoles() {
  await Promise.all(
    ROLE_NAMES.map((name) =>
      Role.findOneAndUpdate({ name }, { $setOnInsert: { name } }, { upsert: true })
    )
  );
}

module.exports = seedRoles;
