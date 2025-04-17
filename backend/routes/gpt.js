const express = require("express");
const router = express.Router();
const { askGPT } = require("../gpt-enhancer");

// 🔧 Enhance Playwright script using GPT
router.post("/enhance", async (req, res) => {
  const { script } = req.body;

  if (!script) {
    return res.status(400).json({ error: "Missing script." });
  }

  try {
    // Instead of a simple prompt, we directly use the script and let the askGPT function handle enhancement
    let enhanced = await askGPT(script);

    // 🧽 Fully sanitize GPT response: remove any markdown-style code blocks
    enhanced = enhanced
      .replace(/```(?:javascript)?\n?/gi, "") // remove ``` or ```javascript (with optional newline)
      .replace(/```$/g, "")                  // remove trailing ```
      .trim();                               // remove extra whitespace

    res.json({ enhanced });
  } catch (err) {
    console.error("❌ GPT enhance error:", err.message || err);
    res.status(500).json({ error: "Failed to enhance script." });
  }
});

module.exports = router;
