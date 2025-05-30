(function () {
  if (window.scriptifyInjected) return;
  window.scriptifyInjected = true;

  const panel = document.createElement("div");
  panel.id = "scriptify-panel";
  panel.className = "scriptify-panel";

  panel.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
      <h2>🎬 Scriptify AI - by Vishal</h2>
      <div style="display: flex; gap: 6px;">
        <button id="minimizeBtn" title="Minimize panel" class="scriptify-icon-btn">➖</button>
        <button id="closeBtn" title="Close panel" class="scriptify-icon-btn">❌</button>
      </div>
    </div>

    <div id="scriptify-body">
      <div style="display: flex; flex-direction: column; gap: 10px;">
        <button class="scriptify-btn" id="recordBtn" title="Start recording user interactions">🎥 Start Recording</button>
        <button class="scriptify-btn" id="stopBtn" title="Stop and save recorded script">🛑 Stop & Save</button>
        <button class="scriptify-btn" id="gptEnhanceBtn" title="Enhance script with GPT suggestions">🤖 Enhance with GPT</button>
        <button class="scriptify-btn" id="copyBtn" title="Copy script to clipboard">📋 Copy to Clipboard</button>
        <button class="scriptify-btn" id="downloadBtn" title="Download script as file">⬇️ Download Script</button>
        <button class="scriptify-btn" id="clearBtn" title="Clear the output and reset timer">🧹 Clear Output</button>
      </div>

      <div id="scriptify-spinner" style="display: none; margin-top: 16px; text-align: center;">
        <div class="spinner"></div>
        <div style="font-size: 13px; margin-top: 6px; color: #888;">Enhancing with GPT...</div>
      </div>

<pre id="scriptify-output" style="max-height: 200px; overflow-y: auto; white-space: pre-wrap;">// Your test script will appear here...</pre>

      <div style="font-size: 11px; margin-top: 10px; color: #777;">
        🖱 Hover over any button to see what it does.
      </div>
    </div>
    <span id="scriptify-timer" style="font-size: 13px; font-weight: bold; color: #888;">⏱ 00:00</span>
  `;

  document.body.appendChild(panel);

  // Timer
  let timerInterval = null;
  let seconds = 0;
  const timerDisplay = document.getElementById("scriptify-timer");

  function resetTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerDisplay.textContent = "⏱ 00:00";
    timerDisplay.style.color = "#888";
  }

  function startTimer() {
    resetTimer();
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

  // Dragging
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

  // Button handlers
  document.getElementById("closeBtn").onclick = () => {
    panel.remove();
    window.scriptifyInjected = false;
  };

  let isMinimized = false;
  const minimizeBtn = document.getElementById("minimizeBtn");
  const bodyDiv = document.getElementById("scriptify-body");

  minimizeBtn.onclick = () => {
    isMinimized = !isMinimized;
    bodyDiv.style.display = isMinimized ? "none" : "block";
    minimizeBtn.textContent = isMinimized ? "➕" : "➖";
  };

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
          data.script || "✅ Launching Playwright Codegen. You can now begin recording your actions.";
        startTimer();
      })
      .catch((err) => {
        document.getElementById("scriptify-output").textContent =
          "❌ Error contacting backend. Make sure to start the server with `node codegen-server.js`.\n\n" +
          (err.message || err);
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
              stopTimer();
            });
        } else {
          document.getElementById("scriptify-output").textContent = "❌ Failed to save script.";
        }
      })
      .catch((err) => {
        document.getElementById("scriptify-output").textContent =
          "❌ Save operation failed: Recording must be initiated before saving the script.\n\n" +
          (err.message || err);
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
          data.enhanced || "❌ GPT returned nothing.";
      })
      .catch((err) => {
        document.getElementById("scriptify-output").textContent =
          "❌ GPT enhancement failed: Required script not found.\n\n" +
          (err.message || err);
      })
      .finally(() => {
        spinner.style.display = "none";
      });
  };

  document.getElementById("copyBtn").onclick = () => {
    const outputEl = document.getElementById("scriptify-output");
    const script = outputEl.textContent.trim();

    if (!script || script === "// Your test script will appear here...") {
      outputEl.textContent = "⚠️ No script found to copy. Start recording a script first.";
      return;
    }

    navigator.clipboard.writeText(script)
      .then(() => {
        outputEl.textContent += "\n\n✅ Copied to clipboard.";
      })
      .catch((err) => {
        outputEl.textContent = `❌ Failed to copy script.\n\n${err.message || err}`;
      });
  };

  document.getElementById("downloadBtn").onclick = () => {
    const script = document.getElementById("scriptify-output").textContent;
    const blob = new Blob([script], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "test-script.txt";
    a.click();
  };

  document.getElementById("clearBtn").onclick = () => {
    document.getElementById("scriptify-output").textContent = "// Your test script will appear here...";
    resetTimer();
  };
})();
