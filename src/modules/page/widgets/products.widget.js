const mongoose = require('mongoose');

/** Which products the list shows; the front end fetches them by this. */
const LIST_TYPES = ['new_arrivals', 'top_selling'];

/** A titled list of products, e.g. "New Arrivals". */
const productsWidgetSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  listType: {
    type: String,
    enum: LIST_TYPES,
    required: true,
  },
});

module.exports = { type: 'products', schema: productsWidgetSchema };
