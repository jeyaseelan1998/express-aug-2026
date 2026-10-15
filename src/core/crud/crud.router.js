const express = require('express');
const validate = require('../middlewares/validate.middleware');
const { paginationRules, validateId } = require('../validators');
const createCrudController = require('./crud.controller');

/**
 * Mounts the standard CRUD endpoints for a service built by createCrudService:
 *
 *   GET    /              list (paginated; `rules.list` adds filter rules)
 *   POST   /              create (`rules.create`)
 *   GET    /:id           get one
 *   PUT    /:id           update (`rules.update`)
 *   PATCH  /:id/delete    soft delete
 *   PATCH  /:id/restore   undo a soft delete
 *   DELETE /:id           hard delete
 *
 * Returns the router, so a module can add its own extra routes to it.
 */
function createCrudRouter({ service, key, rules = {} }) {
  const controller = createCrudController(service, { key });
  const router = express.Router();
  const idRules = validateId();

  router.get('/', [...paginationRules(), ...(rules.list || [])], validate, controller.list);
  router.post('/', rules.create || [], validate, controller.create);

  router.get('/:id', idRules, controller.getById);
  router.put('/:id', idRules, rules.update || [], validate, controller.update);
  router.patch('/:id/delete', idRules, controller.remove);
  router.patch('/:id/restore', idRules, controller.restore);
  router.delete('/:id', idRules, controller.hardDelete);

  return router;
}

module.exports = createCrudRouter;
