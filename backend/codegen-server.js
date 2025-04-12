const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = 4000;

app.use(cors());
app.use(bodyParser.json());

const scriptsDir = path.join(__dirname, "scripts");
const scriptFilePath = path.join(scriptsDir, "recorded.spec.js");

// 🎥 Launch Playwright Codegen GUI and save script
app.post("/codegen", (req, res) => {
  const { url } = req.body;

  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }

  if (fs.existsSync(scriptFilePath)) {
    fs.unlinkSync(scriptFilePath);
  }

  const child = spawn(
    "npx",
    ["playwright", "codegen", url, `--output=${scriptFilePath}`],
    { shell: true }
  );

  child.stderr.on("data", (data) => {
    console.error(`[Codegen stderr] ${data}`);
  });

  child.on("exit", (code) => {
    console.log(`🎬 Codegen exited with code ${code}`);
  });

  res.json({ launched: true });
});

// 💾 Save script file (ensures content is present)
app.post("/save", (req, res) => {
  if (!fs.existsSync(scriptFilePath)) {
    return res.status(404).json({ success: false, error: "No script file found." });
  }

  const content = fs.readFileSync(scriptFilePath, "utf-8").trim();

  if (!content) {
    return res.status(400).json({ success: false, error: "Script file is empty." });
  }

  fs.writeFile(scriptFilePath, content, (err) => {
    if (err) {
      console.error("❌ Error saving script:", err);
      return res.status(500).json({ success: false, error: "Failed to save script." });
    }

    console.log("✅ Script saved to:", scriptFilePath);
    res.json({ success: true });
  });
});

// 📄 Serve the last saved script
app.get("/saved-script", (req, res) => {
  if (!fs.existsSync(scriptFilePath)) {
    return res.status(404).send("// No script found.");
  }

  const content = fs.readFileSync(scriptFilePath, "utf-8");
  res.type("text/plain").send(content);
});

// 🤖 GPT Enhancer Route
const gptRoutes = require("./routes/gpt");
app.use("/gpt", gptRoutes);

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Scriptify backend running at http://localhost:${PORT}`);
});
