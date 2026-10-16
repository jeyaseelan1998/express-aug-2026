const express = require('express');
const createCrudController = require('../../core/crud/crud.controller');
const validate = require('../../core/middlewares/validate.middleware');
const { paginationRules } = require('../../core/validators');
const roleService = require('./role.service');

// Docs: role.docs.yaml. Feeds the role picker on the CMS user form.
const router = express.Router();
const roleController = createCrudController(roleService, { key: 'role' });

router.get('/', paginationRules(), validate, roleController.list);

module.exports = router;
