const mongoose = require('mongoose');
const heroWidget = require('./hero.widget');

/**
 * Every widget a page can hold. Adding a widget type means dropping a
 * `<name>.widget.js` file in this directory and listing it here -- the page
 * model, service and routes need no change.
 */
const widgets = [heroWidget];

/**
 * The shape shared by every widget in a page's `widgets` array. It carries no
 * fields of its own: `type` is the discriminator key, and each widget's own
 * fields come from its schema below.
 */
const widgetSchema = new mongoose.Schema({}, { discriminatorKey: 'type', _id: true });

/**
 * Teaches a page's `widgets` array path how to cast and validate each widget
 * type, so a `{ type: 'hero', ... }` entry is validated against the hero
 * schema and an unknown type is rejected outright.
 */
function registerWidgets(arrayPath) {
  widgets.forEach(({ type, schema }) => arrayPath.discriminator(type, schema));
}

const WIDGET_TYPES = widgets.map((widget) => widget.type);

/** Media refs held by each widget type, e.g. `{ hero: ['image'] }`. */
const WIDGET_MEDIA_PATHS = Object.fromEntries(
  widgets.map((widget) => [widget.type, widget.media || []])
);

/**
 * The populate paths a page read needs to resolve every widget's media in one
 * query. Deduplicated, since two widget types may name the same field.
 */
const WIDGET_POPULATE = [
  ...new Set(widgets.flatMap((widget) => (widget.media || []).map((path) => `widgets.${path}`))),
];

module.exports = {
  widgetSchema,
  registerWidgets,
  WIDGET_TYPES,
  WIDGET_MEDIA_PATHS,
  WIDGET_POPULATE,
};
