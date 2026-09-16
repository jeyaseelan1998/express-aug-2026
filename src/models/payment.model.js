const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');
const softDeletePlugin = require('./plugins/soft-delete.plugin');

const paymentSchema = new mongoose.Schema(
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

paymentSchema.plugin(softDeletePlugin);
paymentSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Payment', paymentSchema);
