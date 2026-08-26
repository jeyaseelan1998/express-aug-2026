const express = require('express');
const authRoutes = require('./auth.routes');

const router = express.Router();

/**
 * @swagger
 * /api/cms/health:
 *   get:
 *     summary: CMS API health check
 *     tags: [CMS]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok', scope: 'cms' });
});

router.use('/auth', authRoutes);

// Add more CMS-only routes here, e.g.:
// const contentRoutes = require('./content.routes');
// router.use('/content', contentRoutes);

module.exports = router;
