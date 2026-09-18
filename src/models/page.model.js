const mongoose = require('mongoose');
const toJsonPlugin = require('./plugins/to-json.plugin');
const softDeletePlugin = require('./plugins/soft-delete.plugin');
const { widgetSchema, registerWidgets, WIDGET_TYPES } = require('./widgets');

const DRAFT = 0;
const PUBLISHED = 1;

const pageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    // The front end addresses pages by slug rather than id, so it stays
    // unique and url-safe.
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase words separated by hyphens'],
    },
    // Draft pages are editable in the CMS but are not served to the public
    // site. New pages start as drafts so nothing goes live by accident.
    status: {
      type: Number,
      enum: [DRAFT, PUBLISHED],
      default: DRAFT,
      index: true,
    },
    metaTitle: {
      type: String,
      trim: true,
      default: null,
    },
    metaDescription: {
      type: String,
      trim: true,
      default: null,
    },
    // Ordered: the array order is the order the widgets render in.
    widgets: {
      type: [widgetSchema],
      default: [],
    },
  },
  { timestamps: true }
);

registerWidgets(pageSchema.path('widgets'));

// An unrecognised `type` is cast against the empty base schema rather than
// rejected, which would quietly store a widget with every field stripped.
pageSchema.path('widgets').validate(
  function knownTypes(list) {
    return (list || []).every((widget) => WIDGET_TYPES.includes(widget.type));
  },
  `widgets entries must have a type of: ${WIDGET_TYPES.join(', ')}`
);

pageSchema.index({ createdAt: -1 });

pageSchema.plugin(softDeletePlugin);
pageSchema.plugin(toJsonPlugin);

module.exports = mongoose.model('Page', pageSchema);
module.exports.DRAFT = DRAFT;
module.exports.PUBLISHED = PUBLISHED;
