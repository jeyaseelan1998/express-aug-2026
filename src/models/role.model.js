const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      enum: ['user', 'admin', 'superadmin'],
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

roleSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Role', roleSchema);
