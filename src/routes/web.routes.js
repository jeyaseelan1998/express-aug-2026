const express = require('express');
const authRoutes = require('../modules/auth/auth.web.routes');
const mediaRoutes = require('../modules/media/media.routes');
const pageRoutes = require('../modules/page/page.web.routes');
const productRoutes = require('../modules/product/product.web.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/media', mediaRoutes);
router.use('/page', pageRoutes);
router.use('/product', productRoutes);

module.exports = router;
