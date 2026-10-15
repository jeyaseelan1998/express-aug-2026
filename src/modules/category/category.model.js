const mongoose = require('mongoose');
const toJsonPlugin = require('../../core/mongoose/to-json.plugin');
const softDeletePlugin = require('../../core/mongoose/soft-delete.plugin');

const categorySchema = new mongoose.Schema(
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

categorySchema.plugin(softDeletePlugin);
categorySchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Category', categorySchema);
