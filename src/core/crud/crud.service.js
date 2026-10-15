const ApiError = require('../api-error');
const assertRefsExist = require('../mongoose/assert-refs');
const { paginationFrom, pageMeta } = require('../paginate');

/**
 * Builds the standard service for a model that uses the soft-delete plugin:
 * list, getById, create, update, remove (soft delete), restore and hardDelete.
 * Every method resolves to serialized JSON, never a Mongoose document.
 *
 * Options:
 *   fields     Fields a create/update may write; anything else is ignored.
 *   label      Used in "<label> not found". Defaults to the model name.
 *   populate   Populate spec applied to every read and write.
 *   refs       Ids that must exist before they are stored, keyed by field:
 *              `{ image: Media }`, or `{ stock: { model: Size, ids: (rows) => [...] } }`
 *              when the ids sit inside the value. Only fields present in the
 *              payload are checked, so partial updates work too.
 *   filters    Query-string keys passed straight through as list filters.
 *   serialize  `async (doc) => json`. Defaults to `doc.toJSON()`.
 */
function createCrudService(
  Model,
  {
    fields,
    label = Model.modelName,
    populate = [],
    refs = {},
    filters = [],
    serialize = (doc) => doc.toJSON(),
  }
) {
  if (!Array.isArray(fields)) {
    throw new Error(`createCrudService(${Model.modelName}): \`fields\` must be an array`);
  }
  const populatePaths = [].concat(populate);

  function pickWritable(payload = {}) {
    return fields.reduce((acc, field) => {
      if (payload[field] !== undefined) acc[field] = payload[field];
      return acc;
    }, {});
  }

  async function populated(doc) {
    if (populatePaths.length) await doc.populate(populatePaths);
    return doc;
  }

  /**
   * Rejects the write if any referenced document is missing, so a record can
   * never be stored holding a dangling ObjectId. Ids are grouped per model so
   * the error names every missing id of that kind at once.
   */
  async function assertPayloadRefs(data) {
    const idsByModel = new Map();
    for (const [field, ref] of Object.entries(refs)) {
      if (data[field] === undefined) continue;
      const { model, ids = (value) => value } = typeof ref === 'function' ? { model: ref } : ref;
      const found = [].concat(ids(data[field]) ?? []);
      idsByModel.set(model, [...(idsByModel.get(model) || []), ...found]);
    }
    await Promise.all(
      [...idsByModel].map(([model, ids]) => assertRefsExist(model, ids, model.modelName))
    );
  }

  /** `withDeleted` looks past the soft-delete filter, for restore and purge. */
  async function findOrFail(id, { withDeleted = false } = {}) {
    let query = Model.findById(id).setOptions({ withDeleted });
    if (populatePaths.length) query = query.populate(populatePaths);
    const doc = await query;
    if (!doc) {
      throw new ApiError(404, `${label} not found`);
    }
    return doc;
  }

  async function list(query = {}, { withDeleted = false } = {}) {
    const { page, limit, skip } = paginationFrom(query);

    const filter = {};
    for (const key of filters) {
      if (query[key] !== undefined) filter[key] = query[key];
    }

    let find = Model.find(filter).setOptions({ withDeleted });
    if (populatePaths.length) find = find.populate(populatePaths);

    const [docs, total] = await Promise.all([
      find.sort({ createdAt: -1 }).skip(skip).limit(limit),
      Model.countDocuments(filter).setOptions({ withDeleted }),
    ]);

    const items = await Promise.all(docs.map(serialize));
    return { items, ...pageMeta({ page, limit, total }) };
  }

  async function getById(id) {
    return serialize(await findOrFail(id));
  }

  async function create(payload) {
    const data = pickWritable(payload);
    await assertPayloadRefs(data);

    const doc = await Model.create(data);
    return serialize(await populated(doc));
  }

  async function update(id, payload) {
    const doc = await findOrFail(id);
    const data = pickWritable(payload);
    await assertPayloadRefs(data);

    Object.assign(doc, data);
    await doc.save();
    return serialize(await populated(doc));
  }

  /** Soft delete: the row is kept and flagged, not removed. */
  async function remove(id) {
    const doc = await findOrFail(id);
    await doc.softDelete();
    return serialize(doc);
  }

  /** Undoes a soft delete. */
  async function restore(id) {
    const doc = await findOrFail(id, { withDeleted: true });
    await doc.restore();
    return serialize(doc);
  }

  /**
   * Hard delete: removes the row for good, with no way back. Works on an
   * already soft-deleted record too, so it can still be purged.
   */
  async function hardDelete(id) {
    const doc = await findOrFail(id, { withDeleted: true });
    await doc.deleteOne();
  }

  return { list, getById, create, update, remove, restore, hardDelete, findOrFail, serialize };
}

module.exports = createCrudService;
