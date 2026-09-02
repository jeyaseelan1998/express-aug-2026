const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');

const promoCodeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { timestamps: true }
);

promoCodeSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('PromoCode', promoCodeSchema);
