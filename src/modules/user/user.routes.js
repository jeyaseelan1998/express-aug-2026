const express = require('express');
const createCrudController = require('../../core/crud/crud.controller');
const validate = require('../../core/middlewares/validate.middleware');
const { paginationRules } = require('../../core/validators');
const userService = require('./user.service');

// Docs: user.docs.yaml
const router = express.Router();
const userController = createCrudController(userService, { key: 'user' });

router.get('/', paginationRules(), validate, userController.list);

module.exports = router;
