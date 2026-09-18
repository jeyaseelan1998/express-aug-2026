const Page = require('../models/page.model');
const Media = require('../models/media.model');
const { WIDGET_MEDIA_PATHS, WIDGET_POPULATE } = require('../models/widgets');
const ApiError = require('../utils/api-error');
const assertRefsExist = require('../utils/assert-refs');
const { paginationFrom, pageMeta } = require('../utils/paginate');
const { attachSignedUrl } = require('./media.service');

/** The media ids a widget list references, whatever the widget types are. */
function widgetMediaIds(widgets = []) {
  return (widgets || []).flatMap((widget) =>
    (WIDGET_MEDIA_PATHS[widget?.type] || []).map((path) => widget?.[path]).filter(Boolean)
  );
}

/** Signs every media ref a widget declares -- objects in S3 stay private. */
async function signWidget(widget) {
  const paths = WIDGET_MEDIA_PATHS[widget?.type] || [];
  if (!paths.length) return widget;

  const signed = { ...widget };
  await Promise.all(
    paths.map(async (path) => {
      signed[path] = await attachSignedUrl(signed[path]);
    })
  );
  return signed;
}

async function serialize(doc) {
  const json = doc.toJSON();
  json.widgets = await Promise.all((json.widgets || []).map(signWidget));
  return json;
}

/**
 * Rejects the write if a widget points at media that does not exist, so a
 * page can never be stored holding a dangling image ref.
 */
async function assertPayloadRefs(payload) {
  if (payload.widgets === undefined) return;
  await assertRefsExist(Media, widgetMediaIds(payload.widgets), 'Media');
}

async function findOrFail(id, { withDeleted = false } = {}) {
  const page = await Page.findById(id).setOptions({ withDeleted }).populate(WIDGET_POPULATE);
  if (!page) {
    throw new ApiError(404, 'Page not found');
  }
  return page;
}

async function listPages(query = {}, { withDeleted = false } = {}) {
  const { page, limit, skip } = paginationFrom(query);

  // The CMS lists drafts and published pages together unless it asks for one.
  const filter = {};
  if (query.status !== undefined) filter.status = query.status;

  const [docs, total] = await Promise.all([
    Page.find(filter)
      .setOptions({ withDeleted })
      .populate(WIDGET_POPULATE)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Page.countDocuments(filter).setOptions({ withDeleted }),
  ]);

  const items = await Promise.all(docs.map(serialize));
  return { items, ...pageMeta({ page, limit, total }) };
}

async function getPage(id) {
  return serialize(await findOrFail(id));
}

/**
 * The details lookup the front end uses: pages are addressed by slug there.
 * Drafts are treated as missing rather than forbidden, so an unpublished slug
 * gives nothing away; soft-deleted pages stay hidden like any other read.
 */
async function getPageBySlug(slug) {
  const page = await Page.findOne({
    slug: String(slug).toLowerCase(),
    status: Page.PUBLISHED,
  }).populate(WIDGET_POPULATE);
  if (!page) {
    throw new ApiError(404, 'Page not found');
  }
  return serialize(page);
}

const WRITABLE_FIELDS = ['title', 'slug', 'status', 'metaTitle', 'metaDescription', 'widgets'];

function pickWritable(payload) {
  return WRITABLE_FIELDS.reduce((acc, field) => {
    if (payload[field] !== undefined) acc[field] = payload[field];
    return acc;
  }, {});
}

async function createPage(payload) {
  const data = pickWritable(payload);
  await assertPayloadRefs(data);

  const page = await Page.create(data);
  await page.populate(WIDGET_POPULATE);
  return serialize(page);
}

/**
 * `widgets` is replaced wholesale rather than merged: the array order is the
 * render order, so the CMS always sends the list it wants stored.
 */
async function updatePage(id, payload) {
  const page = await findOrFail(id);
  const data = pickWritable(payload);
  await assertPayloadRefs(data);

  Object.assign(page, data);
  await page.save();
  await page.populate(WIDGET_POPULATE);
  return serialize(page);
}

/** Soft delete: the row is kept and flagged, not removed. */
async function deletePage(id) {
  const page = await findOrFail(id);
  await page.softDelete();
  return serialize(page);
}

/**
 * Undoes a soft delete. Looks past the soft-delete filter so the flagged row
 * can be found in the first place.
 */
async function restorePage(id) {
  const page = await findOrFail(id, { withDeleted: true });
  await page.restore();
  return serialize(page);
}

/**
 * Hard delete: removes the row for good, with no way back. Looks past the
 * soft-delete filter so an already-deleted record can still be purged.
 */
async function hardDeletePage(id) {
  const page = await findOrFail(id, { withDeleted: true });
  await page.deleteOne();
}

module.exports = {
  listPages,
  getPage,
  getPageBySlug,
  createPage,
  updatePage,
  deletePage,
  restorePage,
  hardDeletePage,
};
