const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

const colorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [HEX_COLOR, 'Code must be a hex colour, e.g. #fff or #ff8800'],
    },
    keywords: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

colorSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Color', colorSchema);
