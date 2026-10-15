const mongoose = require('mongoose');
const toJsonPlugin = require('../../core/mongoose/to-json.plugin');
const softDeletePlugin = require('../../core/mongoose/soft-delete.plugin');

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

newsletterSchema.plugin(softDeletePlugin);
newsletterSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Newsletter', newsletterSchema);
