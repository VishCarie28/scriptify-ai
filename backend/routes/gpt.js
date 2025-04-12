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
    const prompt = `Improve the following Playwright script with better test validations, assertions, and structure:\n\n${script}`;
    let enhanced = await askGPT(prompt);

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
