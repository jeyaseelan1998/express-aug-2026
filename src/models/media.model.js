const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const mediaSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    bucket: {
      type: String,
      required: true,
      trim: true,
    },
    originalName: {
      type: String,
      required: true,
      trim: true,
    },
    mimetype: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

mediaSchema.index({ createdAt: -1 });

mediaSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Media', mediaSchema);
