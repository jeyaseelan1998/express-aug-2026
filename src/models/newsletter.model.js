const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const newsletterSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
  },
  { timestamps: true }
);

newsletterSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Newsletter', newsletterSchema);
