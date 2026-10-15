const mongoose = require('mongoose');

/** Single call to action. Stored inline -- a hero never has more than one. */
const buttonSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional: a button with no link is a label the front end wires up itself.
    link: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { _id: false }
);

/** One headline figure, e.g. { unit: '200+', label: 'International Brands' }. */
const statSchema = new mongoose.Schema(
  {
    unit: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: true }
);

const heroWidgetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  text: {
    type: String,
    trim: true,
    default: null,
  },
  image: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: true,
  },
  button: {
    type: buttonSchema,
    default: null,
  },
  stats: {
    type: [statSchema],
    default: [],
  },
});

// `media` names the Media refs this widget holds, so page reads can populate
// and sign them without knowing what a hero looks like.
module.exports = { type: 'hero', schema: heroWidgetSchema, media: ['image'] };
