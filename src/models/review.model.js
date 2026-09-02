const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const reviewSchema = new mongoose.Schema(
  {
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
  },
  { timestamps: true }
);

// Reviews are almost always read per product, newest first.
reviewSchema.index({ product: 1, createdAt: -1 });

reviewSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Review', reviewSchema);
