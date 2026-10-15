const mongoose = require('mongoose');

/** A row of brands, shown in the order they are listed. */
const brandsWidgetSchema = new mongoose.Schema({
  brands: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    default: [],
  },
});

// `refs` names the non-media refs this widget holds, the fields to return for
// each referenced document, and the Media refs among them, so page reads can
// populate the brands and sign their logos without knowing what a brands
// widget looks like.
module.exports = {
  type: 'brands',
  schema: brandsWidgetSchema,
  refs: [{ path: 'brands', select: 'name image', media: ['image'] }],
};
