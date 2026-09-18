const express = require('express');
const authRoutes = require('./auth.routes');
const mediaRoutes = require('../media.routes');
const pageRoutes = require('./page.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);
router.use('/page', pageRoutes);

module.exports = router;
