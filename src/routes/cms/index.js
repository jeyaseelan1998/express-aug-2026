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
const requireAuth = require('../../middlewares/auth.middleware');

const router = express.Router();

// Signing in has to stay reachable without a token.
router.use('/auth', authRoutes);

// The media router object is shared with the web surface, so the CMS mount
// tags the request and handlers that differ between the two can branch on it.
function markCmsSurface(req, res, next) {
  req.isCmsSurface = true;
  next();
}

router.use('/media', markCmsSurface, mediaRoutes);

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

module.exports = router;
