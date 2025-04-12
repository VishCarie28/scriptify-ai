(function () {
  if (window.scriptifyInjected) return;
  window.scriptifyInjected = true;

  const panel = document.createElement("div");
  panel.id = "scriptify-panel";
  panel.style.position = "fixed";
  panel.style.top = "80px";
  panel.style.right = "20px";
  panel.style.width = "360px";
  panel.style.backgroundColor = "#ffffff";
  panel.style.color = "#222";
  panel.style.border = "1px solid #ccc";
  panel.style.borderRadius = "16px";
  panel.style.padding = "16px";
  panel.style.fontFamily = "Segoe UI, sans-serif";
  panel.style.zIndex = "99999";
  panel.style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)";
  panel.style.resize = "both";
  panel.style.overflow = "auto";

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h2 style="margin: 0; font-size: 18px; color: #00b894;">🎬 Scriptify AI by Vishal</h2>
      <div style="display: flex; gap: 6px;">
        <button id="minimizeBtn" title="Minimize panel" style="border:none;background:transparent;font-size:10px;cursor:pointer;">➖</button>
        <button id="closeBtn" title="Close panel" style="border:none;background:transparent;font-size:10px;cursor:pointer;">❌</button>
      </div>
    </div>

    <div id="scriptify-body">
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="scriptify-btn" id="recordBtn" title="Start recording your actions on this page.">🎥 Start Recording</button>
        <button class="scriptify-btn" id="stopBtn" title="Stop recording and save the script.">🛑 Stop & Save</button>
        <button class="scriptify-btn" id="gptEnhanceBtn" title="Enhance your recorded script with GPT intelligence.">🤖 Enhance with GPT</button>
        <button class="scriptify-btn" id="copyBtn" title="Copy the generated script to your clipboard.">📋 Copy to Clipboard</button>
        <button class="scriptify-btn" id="downloadBtn" title="Download your script as a .js file.">⬇️ Download Script</button>
      </div>

      <div id="scriptify-spinner" style="display: none; margin-top: 16px; text-align: center;">
        <div class="spinner"></div>
        <div style="font-size: 13px; margin-top: 6px; color: #888;">Enhancing with GPT...</div>
      </div>

      <pre id="scriptify-output" style="
        margin-top: 16px;
        background: #f4f4f4;
        padding: 12px;
        border-radius: 8px;
        font-size: 12px;
        max-height: 300px;
        overflow-y: auto;
        white-space: pre-wrap;
        font-family: 'Fira Code', monospace;
        color: #222;
        border: 1px solid #ddd;
      ">// Your test script will appear here...</pre>

      <div style="font-size: 11px; margin-top: 10px; color: #777;">
        🛈 Hover over any button to see what it does.
      </div>
    </div>
    <span id="scriptify-timer" style="font-size: 13px; font-weight: bold; color: #888;">⏱ 00:00</span>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #scriptify-panel .scriptify-btn {
      padding: 10px 14px;
      font-size: 14px;
      font-weight: 500;
      border: 1px solid #ccc;
      background: #f9f9f9;
      color: #333;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s ease, transform 0.1s ease;
      text-align: left;
    }

    #scriptify-panel .scriptify-btn:hover {
      background: #eaeaea;
    }

    #scriptify-panel .scriptify-btn:active {
      transform: scale(0.98);
    }

    #scriptify-spinner .spinner {
      margin: 0 auto;
      width: 24px;
      height: 24px;
      border: 3px solid #ccc;
      border-top: 3px solid #00b894;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
  document.body.appendChild(panel);

  // Timer handling
  let timerInterval = null;
  let seconds = 0;
  const timerDisplay = document.getElementById("scriptify-timer");

  function startTimer() {
    seconds = 0;
    timerDisplay.style.color = "#28a745";
    timerInterval = setInterval(() => {
      seconds++;
      const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      timerDisplay.textContent = `⏱ ${mins}:${secs}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerDisplay.style.color = "#e74c3c";
  }

  // Draggable panel
  panel.onmousedown = function (e) {
    let offsetX = e.clientX - panel.getBoundingClientRect().left;
    let offsetY = e.clientY - panel.getBoundingClientRect().top;

    function onMouseMove(e) {
      panel.style.left = e.clientX - offsetX + "px";
      panel.style.top = e.clientY - offsetY + "px";
    }

    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Close Button
  document.getElementById("closeBtn").onclick = () => {
    panel.remove();
    window.scriptifyInjected = false;
  };

  // Minimize toggle
  let isMinimized = false;
  const minimizeBtn = document.getElementById("minimizeBtn");
  const bodyDiv = document.getElementById("scriptify-body");

  minimizeBtn.onclick = () => {
    isMinimized = !isMinimized;
    bodyDiv.style.display = isMinimized ? "none" : "block";
    minimizeBtn.textContent = isMinimized ? "➕" : "➖";
  };

  // Button handlers
  document.getElementById("recordBtn").onclick = () => {
    const targetUrl = window.location.href;
    fetch("http://localhost:4000/codegen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("scriptify-output").textContent =
          data.script || "// No script returned.";
        startTimer();
      })
      .catch((err) => {
        document.getElementById("scriptify-output").textContent =
          "// Error contacting backend.";
        console.error("Record error:", err.message || err);
      });
  };

  document.getElementById("stopBtn").onclick = () => {
    const finalScript = document.getElementById("scriptify-output").textContent;

    fetch("http://localhost:4000/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: finalScript }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          fetch("http://localhost:4000/saved-script")
            .then((res) => res.text())
            .then((script) => {
              document.getElementById("scriptify-output").textContent = script;
              alert("✅ Script saved and previewed successfully.");
              stopTimer();
            });
        } else {
          alert("⚠️ Failed to save script.");
        }
      })
      .catch((err) => {
        alert("❌ Error saving script.");
        console.error("Save error:", err.message || err);
      });
  };

  document.getElementById("gptEnhanceBtn").onclick = () => {
    const rawScript = document.getElementById("scriptify-output").textContent;
    const spinner = document.getElementById("scriptify-spinner");
    spinner.style.display = "block";

    fetch("http://localhost:4000/gpt/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: rawScript }),
    })
      .then((res) => res.json())
      .then((data) => {
        document.getElementById("scriptify-output").textContent =
          data.enhanced || "// GPT returned nothing.";
      })
      .catch((err) => {
        document.getElementById("scriptify-output").textContent =
          "// GPT enhancement failed.";
        console.error("Enhance error:", err.message || err);
      })
      .finally(() => {
        spinner.style.display = "none";
      });
  };

  document.getElementById("copyBtn").onclick = () => {
    const script = document.getElementById("scriptify-output").textContent;
    navigator.clipboard.writeText(script).then(() => {
      alert("✅ Script copied to clipboard.");
    });
  };

  document.getElementById("downloadBtn").onclick = () => {
    const blob = new Blob(
      [document.getElementById("scriptify-output").textContent],
      { type: "text/plain;charset=utf-8" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scriptify-test.spec.js";
    a.click();
    URL.revokeObjectURL(url);
  };
})();
