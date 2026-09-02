const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const brandSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
  },
  { timestamps: true }
);

brandSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Brand', brandSchema);
