const mongoose = require('mongoose');
const toJsonPlugin = require('../../core/mongoose/to-json.plugin');
const softDeletePlugin = require('../../core/mongoose/soft-delete.plugin');

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

roleSchema.plugin(softDeletePlugin);
roleSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Role', roleSchema);
