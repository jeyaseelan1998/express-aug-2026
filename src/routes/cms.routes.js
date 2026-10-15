const express = require('express');
const requireAuth = require('../modules/auth/auth.middleware');
const authRoutes = require('../modules/auth/auth.cms.routes');
const mediaRoutes = require('../modules/media/media.routes');
const productRoutes = require('../modules/product/product.routes');
const brandRoutes = require('../modules/brand/brand.routes');
const categoryRoutes = require('../modules/category/category.routes');
const styleRoutes = require('../modules/style/style.routes');
const colorRoutes = require('../modules/color/color.routes');
const promoCodeRoutes = require('../modules/promo-code/promo-code.routes');
const sizeRoutes = require('../modules/size/size.routes');
const socialRoutes = require('../modules/social/social.routes');
const pageRoutes = require('../modules/page/page.cms.routes');

const router = express.Router();

// Everything mounted here is the CMS surface. Routers and services are shared
// with the web surface, so list handlers read this flag to decide whether
// soft-deleted records are shown (the CMS shows them, so they can be purged).
router.use(function includeDeleted(req, res, next) {
  req.withDeleted = true;
  next();
});

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
