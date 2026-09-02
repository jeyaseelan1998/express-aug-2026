const Product = require('../models/product.model');
const Media = require('../models/media.model');
const Category = require('../models/category.model');
const Color = require('../models/color.model');
const Style = require('../models/style.model');
const Brand = require('../models/brand.model');
const Size = require('../models/size.model');
const ApiError = require('../utils/api-error');
const assertRefsExist = require('../utils/assert-refs');
const { paginationFrom, pageMeta } = require('../utils/paginate');
const { attachSignedUrl } = require('./media.service');

// Brand and Style each carry their own media ref, so both are populated one
// level deeper to spare the CMS a follow-up request per row.
const POPULATE = [
  'thumbnail',
  'images',
  'category',
  'color',
  { path: 'brand', populate: { path: 'image' } },
  { path: 'style', populate: { path: 'image' } },
  { path: 'stock.size' },
];

/** Signs the media ref nested inside a populated brand or style. */
async function signNestedImage(entity) {
  if (!entity || typeof entity !== 'object' || !entity.image) {
    return entity;
  }
  return { ...entity, image: await attachSignedUrl(entity.image) };
}

async function serialize(doc) {
  const json = doc.toJSON();

  json.thumbnail = await attachSignedUrl(json.thumbnail);
  json.images = await Promise.all((json.images || []).map(attachSignedUrl));
  json.brand = await signNestedImage(json.brand);
  json.style = await Promise.all((json.style || []).map(signNestedImage));

  return json;
}

/**
 * Rejects the write if any referenced document is missing, so a product can
 * never be stored pointing at a category or size that does not exist. Only
 * the fields actually present in the payload are checked, which keeps this
 * usable for both create and partial update.
 */
async function assertPayloadRefs(payload) {
  const mediaIds = [];
  if (payload.thumbnail !== undefined) mediaIds.push(payload.thumbnail);
  if (payload.images !== undefined) mediaIds.push(...(payload.images || []));

  await Promise.all([
    assertRefsExist(Media, mediaIds, 'Media'),
    payload.category !== undefined ? assertRefsExist(Category, payload.category, 'Category') : null,
    payload.color !== undefined ? assertRefsExist(Color, payload.color, 'Color') : null,
    payload.style !== undefined ? assertRefsExist(Style, payload.style, 'Style') : null,
    payload.brand !== undefined ? assertRefsExist(Brand, payload.brand, 'Brand') : null,
    payload.stock !== undefined
      ? assertRefsExist(
          Size,
          (payload.stock || []).map((row) => row?.size),
          'Size'
        )
      : null,
  ]);
}

async function findOrFail(id) {
  const product = await Product.findById(id).populate(POPULATE);
  if (!product) {
    throw new ApiError(404, 'Product not found');
  }
  return product;
}

async function listProducts(query = {}) {
  const { page, limit, skip } = paginationFrom(query);

  const filter = {};
  if (query.brand) filter.brand = query.brand;
  if (query.category) filter.category = query.category;

  const [docs, total] = await Promise.all([
    Product.find(filter).populate(POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Product.countDocuments(filter),
  ]);

  const items = await Promise.all(docs.map(serialize));
  return { items, ...pageMeta({ page, limit, total }) };
}

async function getProduct(id) {
  return serialize(await findOrFail(id));
}

const WRITABLE_FIELDS = [
  'name',
  'thumbnail',
  'images',
  'rating',
  'price',
  'discount',
  'description',
  'details',
  'faq',
  'category',
  'color',
  'style',
  'stock',
  'shipping',
  'brand',
  'minUnit',
  'maxUnit',
];

function pickWritable(payload) {
  return WRITABLE_FIELDS.reduce((acc, field) => {
    if (payload[field] !== undefined) acc[field] = payload[field];
    return acc;
  }, {});
}

async function createProduct(payload) {
  const data = pickWritable(payload);
  await assertPayloadRefs(data);

  const product = await Product.create(data);
  await product.populate(POPULATE);
  return serialize(product);
}

async function updateProduct(id, payload) {
  const product = await findOrFail(id);
  const data = pickWritable(payload);
  await assertPayloadRefs(data);

  Object.assign(product, data);
  await product.save();
  await product.populate(POPULATE);
  return serialize(product);
}

async function deleteProduct(id) {
  const product = await findOrFail(id);
  await product.deleteOne();
}

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
};
