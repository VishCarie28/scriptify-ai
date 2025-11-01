// backend/routes/analytics.routes.js
const express = require("express");
const router = express.Router();
const { 
    generateAnalyticsReport, 
    getAnalyticsData, 
    openAnalyticsReport,
    getTestInsights,
    getPerformanceMetrics
} = require("../controllers/analytics.controller.cjs");

// POST /api/analytics/generate
router.post("/generate", generateAnalyticsReport);

// GET /api/analytics/data
router.get("/data", getAnalyticsData);

// GET /api/analytics/open
router.get("/open", openAnalyticsReport);

// GET /api/analytics/insights
router.get("/insights", getTestInsights);

// GET /api/analytics/performance
router.get("/performance", getPerformanceMetrics);

module.exports = router;
