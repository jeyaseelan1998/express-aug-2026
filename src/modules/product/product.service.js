const createCrudService = require('../../core/crud/crud.service');
const Brand = require('../brand/brand.model');
const Category = require('../category/category.model');
const Color = require('../color/color.model');
const Media = require('../media/media.model');
const { attachSignedUrl, signMediaPaths } = require('../media/media.service');
const Size = require('../size/size.model');
const Style = require('../style/style.model');
const Product = require('./product.model');

async function serialize(doc) {
  const json = await signMediaPaths(doc.toJSON(), ['thumbnail']);

  json.images = await Promise.all((json.images || []).map(attachSignedUrl));
  // Brand and style carry their own image, signed one level down.
  json.brand = await signMediaPaths(json.brand, ['image']);
  json.style = await Promise.all(
    (json.style || []).map((style) => signMediaPaths(style, ['image']))
  );

  return json;
}

module.exports = createCrudService(Product, {
  fields: [
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
  ],
  // Brand and Style are populated one level deeper to spare the CMS a
  // follow-up request per row for their images.
  populate: [
    'thumbnail',
    'images',
    'category',
    'color',
    { path: 'brand', populate: { path: 'image' } },
    { path: 'style', populate: { path: 'image' } },
    { path: 'stock.size' },
  ],
  refs: {
    thumbnail: Media,
    images: Media,
    category: Category,
    color: Color,
    style: Style,
    brand: Brand,
    stock: { model: Size, ids: (rows) => (rows || []).map((row) => row?.size) },
  },
  filters: ['brand', 'category'],
  serialize,
});
