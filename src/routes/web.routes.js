const express = require('express');
const authRoutes = require('../modules/auth/auth.web.routes');
const mediaRoutes = require('../modules/media/media.routes');
const pageRoutes = require('../modules/page/page.web.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);
router.use('/page', pageRoutes);

module.exports = router;
