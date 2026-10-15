const mongoose = require('mongoose');
const toJsonPlugin = require('../../core/mongoose/to-json.plugin');
const softDeletePlugin = require('../../core/mongoose/soft-delete.plugin');

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
