// backend/routes/jenkins.routes.js
const express = require("express");
const router = express.Router();
const { triggerPipeline, getJenkinsStatus, getJobStatus } = require("../controllers/jenkins.controller.cjs");

// POST /api/jenkins/trigger
router.post("/trigger", triggerPipeline);

// GET /api/jenkins/status
router.get("/status", getJenkinsStatus);

// GET /api/jenkins/job-status
router.get("/job-status", getJobStatus);

module.exports = router;
