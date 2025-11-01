// backend/routes/enhancer.routes.cjs
const express = require('express');
const router = express.Router();
// Use CommonJS wrapper for ES module enhancer controller
const { enhanceScript, getEnhancementStatus } = require('../controllers/enhancer-wrapper.cjs');

// POST /api/enhancer/enhance
router.post('/enhance', enhanceScript);

// GET /api/enhancer/status
router.get('/status', getEnhancementStatus);

module.exports = router;
