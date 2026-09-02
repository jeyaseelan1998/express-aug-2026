const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const isInteger = {
  validator: Number.isInteger,
  message: '{PATH} must be a whole number',
};

const faqSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

/** Per-size stock level, so availability is tracked size by size. */
const stockSchema = new mongoose.Schema(
  {
    stock: {
      type: Number,
      required: true,
      min: 0,
      validate: isInteger,
    },
    size: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Size',
      required: true,
    },
  },
  { _id: true }
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Media',
      required: true,
    },
    images: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
      },
    ],
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    details: {
      type: String,
      trim: true,
    },
    faq: {
      type: [faqSchema],
      default: [],
    },
    category: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    color: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Color',
      },
    ],
    style: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Style',
      },
    ],
    stock: {
      type: [stockSchema],
      default: [],
    },
    shipping: {
      type: Number,
      min: 0,
      default: 0,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    minUnit: {
      type: Number,
      min: 1,
      default: 1,
      validate: isInteger,
    },
    maxUnit: {
      type: Number,
      min: 1,
      default: null,
      validate: {
        validator(value) {
          if (value === null || value === undefined) return true;
          return Number.isInteger(value) && value >= this.minUnit;
        },
        message: 'maxUnit must be a whole number not smaller than minUnit',
      },
    },
  },
  { timestamps: true }
);

// A product should not carry two stock rows for the same size.
productSchema.path('stock').validate(function uniqueSizes(rows) {
  const sizes = (rows || []).map((row) => String(row.size));
  return sizes.length === new Set(sizes).size;
}, 'stock contains duplicate sizes');

productSchema.index({ createdAt: -1 });
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });

productSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Product', productSchema);
