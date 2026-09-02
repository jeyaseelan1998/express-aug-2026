const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

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
    image: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      default: null,
    },
  },
  { timestamps: true }
);

socialSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Social', socialSchema);
