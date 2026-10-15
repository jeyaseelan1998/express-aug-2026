const express = require('express');
const validate = require('../../core/middlewares/validate.middleware');
const { paginationRules, validateId } = require('../../core/validators');
const mediaController = require('./media.controller');
const upload = require('./upload.middleware');

// Mounted under both /api/web/media and /api/cms/media. Docs: media.docs.yaml.
const router = express.Router();
const idRules = validateId('A valid media id is required');

router.post('/', upload.single('file'), mediaController.upload);
router.get('/', paginationRules(), validate, mediaController.list);

router.get('/:id', idRules, mediaController.getById);
router.put('/:id', idRules, upload.single('file'), mediaController.update);

router.patch('/:id/delete', idRules, mediaController.remove);
router.delete('/:id', idRules, mediaController.hardDelete);

router.get('/:id/stream', idRules, mediaController.stream);

module.exports = router;
