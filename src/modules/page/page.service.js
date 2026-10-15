const ApiError = require('../../core/api-error');
const createCrudService = require('../../core/crud/crud.service');
const Media = require('../media/media.model');
const { attachSignedUrl, signMediaPaths } = require('../media/media.service');
const Page = require('./page.model');
const { WIDGET_MEDIA_PATHS, WIDGET_REF_PATHS, WIDGET_POPULATE } = require('./widgets');

const POPULATE = ['ogImage', ...WIDGET_POPULATE];

/** The media ids a widget list references, whatever the widget types are. */
function widgetMediaIds(widgets = []) {
  return (widgets || []).flatMap((widget) =>
    (WIDGET_MEDIA_PATHS[widget?.type] || []).map((path) => widget?.[path]).filter(Boolean)
  );
}

/**
 * Signs every media ref a widget declares, including the media on the
 * documents it references (a brand's logo) -- objects in S3 stay private.
 */
async function signWidget(widget) {
  const signed = await signMediaPaths(widget, WIDGET_MEDIA_PATHS[widget?.type] || []);
  const refs = WIDGET_REF_PATHS[widget?.type] || [];
  await Promise.all(
    refs.map(async ({ path, media = [] }) => {
      const value = signed[path];
      signed[path] = Array.isArray(value)
        ? await Promise.all(value.map((entity) => signMediaPaths(entity, media)))
        : await signMediaPaths(value, media);
    })
  );
  return signed;
}

async function serialize(doc) {
  const json = doc.toJSON();
  json.ogImage = await attachSignedUrl(json.ogImage);
  json.widgets = await Promise.all((json.widgets || []).map(signWidget));
  return json;
}

const crud = createCrudService(Page, {
  // `widgets` is replaced wholesale rather than merged: the array order is the
  // render order, so the CMS always sends the list it wants stored.
  fields: [
    'title',
    'slug',
    'status',
    'metaTitle',
    'metaDescription',
    'keywords',
    'ogImage',
    'widgets',
  ],
  populate: POPULATE,
  refs: {
    ogImage: Media,
    widgets: { model: Media, ids: widgetMediaIds },
  },
  // The CMS lists drafts and published pages together unless it asks for one.
  filters: ['status'],
  serialize,
});

/**
 * The details lookup the front end uses: pages are addressed by slug there.
 * Drafts are treated as missing rather than forbidden, so an unpublished slug
 * gives nothing away; soft-deleted pages stay hidden like any other read.
 */
async function getBySlug(slug) {
  const page = await Page.findOne({
    slug: String(slug).toLowerCase(),
    status: Page.PUBLISHED,
  }).populate(POPULATE);
  if (!page) {
    throw new ApiError(404, 'Page not found');
  }
  return serialize(page);
}

module.exports = { ...crud, getBySlug };
