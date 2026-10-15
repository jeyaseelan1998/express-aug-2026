const asyncHandler = require('../async-handler');

/**
 * Express handlers for a service built by createCrudService. Single records
 * are wrapped in `{ [key]: record }`, e.g. `{ brand: {...} }`.
 *
 * Lists include soft-deleted rows when an earlier middleware has set
 * `req.withDeleted` (the CMS router does, so admins can see and purge them).
 */
function createCrudController(service, { key }) {
  return {
    list: asyncHandler(async (req, res) => {
      const result = await service.list(req.query, { withDeleted: req.withDeleted });
      res.status(200).json(result);
    }),

    getById: asyncHandler(async (req, res) => {
      res.status(200).json({ [key]: await service.getById(req.params.id) });
    }),

    create: asyncHandler(async (req, res) => {
      res.status(201).json({ [key]: await service.create(req.body) });
    }),

    update: asyncHandler(async (req, res) => {
      res.status(200).json({ [key]: await service.update(req.params.id, req.body) });
    }),

    remove: asyncHandler(async (req, res) => {
      res.status(200).json({ [key]: await service.remove(req.params.id) });
    }),

    restore: asyncHandler(async (req, res) => {
      res.status(200).json({ [key]: await service.restore(req.params.id) });
    }),

    // Permanent: the row is gone afterwards, so nothing is returned.
    hardDelete: asyncHandler(async (req, res) => {
      await service.hardDelete(req.params.id);
      res.status(204).send();
    }),
  };
}

module.exports = createCrudController;
