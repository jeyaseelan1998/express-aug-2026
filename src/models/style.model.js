const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const styleSchema = new mongoose.Schema(
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

styleSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Style', styleSchema);
