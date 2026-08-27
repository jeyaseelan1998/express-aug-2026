const express = require('express');
const authRoutes = require('./auth.routes');
const mediaRoutes = require('../media.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);

// Add more CMS-only routes here, e.g.:
// const contentRoutes = require('./content.routes');
// router.use('/content', contentRoutes);

module.exports = router;
