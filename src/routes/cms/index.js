const express = require('express');
const authRoutes = require('./auth.routes');
const mediaRoutes = require('../media.routes');
const productRoutes = require('./product.routes');
const brandRoutes = require('./brand.routes');
const categoryRoutes = require('./category.routes');
const styleRoutes = require('./style.routes');
const colorRoutes = require('./color.routes');
const promoCodeRoutes = require('./promo-code.routes');
const sizeRoutes = require('./size.routes');
const socialRoutes = require('./social.routes');
const pageRoutes = require('./page.routes');
const requireAuth = require('../../middlewares/auth.middleware');

const router = express.Router();

// Everything mounted here is the CMS surface. Router objects and services are
// shared with the web surface, so handlers that differ between the two -- such
// as the lists that show soft-deleted records -- branch on this flag.
function markCmsSurface(req, res, next) {
  req.isCmsSurface = true;
  next();
}

router.use(markCmsSurface);

// Signing in has to stay reachable without a token.
router.use('/auth', authRoutes);

router.use('/media', mediaRoutes);

// Everything below requires a CMS session. cmsSignin already refuses
// non-admin accounts, so a valid cms-scoped token implies admin rights.
const requireCmsAuth = requireAuth('cms');

router.use('/product', requireCmsAuth, productRoutes);
router.use('/brand', requireCmsAuth, brandRoutes);
router.use('/category', requireCmsAuth, categoryRoutes);
router.use('/style', requireCmsAuth, styleRoutes);
router.use('/color', requireCmsAuth, colorRoutes);
router.use('/promo-code', requireCmsAuth, promoCodeRoutes);
router.use('/size', requireCmsAuth, sizeRoutes);
router.use('/social', requireCmsAuth, socialRoutes);
router.use('/page', requireCmsAuth, pageRoutes);

module.exports = router;
