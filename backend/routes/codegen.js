// routes/codegen.js

const fs = require("fs");
const path = require("path");
const express = require("express");
const router = express.Router();

const SCRIPT_PATH = path.join(__dirname, "..", "scripts", "recorded.spec.js");

// ✅ GET /saved-script: Return the saved Playwright script
router.get("/saved-script", (req, res) => {
  fs.readFile(SCRIPT_PATH, "utf8", (err, data) => {
    if (err) {
      console.error("Failed to read saved script:", err);
      return res.status(500).send("// Error loading script.");
    }
    res.setHeader("Content-Type", "text/plain");
    res.send(data);
  });
});

module.exports = router;
