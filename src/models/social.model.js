const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');
const softDeletePlugin = require('./plugins/soft-delete.plugin');

const socialSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    link: {
      type: String,
      required: true,
      trim: true,
    },
    // An icon name the front end resolves against its own icon set, rather
    // than an uploaded asset -- social marks are a fixed, known set.
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    background: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Color',
      default: null,
    },
  },
  { timestamps: true }
);

socialSchema.plugin(softDeletePlugin);
socialSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Social', socialSchema);
