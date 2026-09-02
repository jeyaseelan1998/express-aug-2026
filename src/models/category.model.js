const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

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

categorySchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Category', categorySchema);
