const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');
const softDeletePlugin = require('./plugins/soft-delete.plugin');

const sizeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
  },
  { timestamps: true }
);

sizeSchema.plugin(softDeletePlugin);
sizeSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Size', sizeSchema);
