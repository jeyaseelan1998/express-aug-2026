const express = require('express');
const webRoutes = require('./web');
const cmsRoutes = require('./cms');

const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'Hello, world!' });
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: API health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

router.use('/api/web', webRoutes);
router.use('/api/cms', cmsRoutes);

module.exports = router;
