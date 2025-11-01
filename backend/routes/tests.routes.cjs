// backend/routes/tests.routes.js
const express = require("express");
const router = express.Router();
const { runTests, getTestStatus, getTestResults } = require("../controllers/tests.controller.cjs");

// POST /api/tests/run
router.post("/run", runTests);

// GET /api/tests/status
router.get("/status", getTestStatus);

// GET /api/tests/results
router.get("/results", getTestResults);

module.exports = router;
