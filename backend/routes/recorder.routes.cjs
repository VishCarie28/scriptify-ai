// backend/routes/recorder.routes.js
const express = require("express");
const router = express.Router();
const { startRecording, stopRecording, getStatus } = require("../controllers/recorder.controller.cjs");

// POST /api/recorder/start
router.post("/start", startRecording);

// POST /api/recorder/stop
router.post("/stop", stopRecording);

// GET /api/recorder/status
router.get("/status", getStatus);

module.exports = router;
