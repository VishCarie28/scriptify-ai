(function () {
  // Prevent multiple injections of the panel
  if (window.scriptifyInjected) return;
  window.scriptifyInjected = true;

  // --- Global State Variables ---
  // Tracks if the content in the output area is a valid script or an error/placeholder.
  // This is crucial for 'copy' and 'download' buttons.
  let isScriptValid = false;

  // --- Panel Creation ---
  // Creates the main container for the Scriptify AI panel
  const panel = document.createElement("div");
  panel.id = "scriptify-panel";
  panel.className = "scriptify-panel";

  // --- Panel HTML Structure ---
  // Sets the internal HTML for the panel, including buttons, spinner, output area, and timer.
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
        <button class="scriptify-btn" id="copyBtn" title="Copy to clipboard">📋 Copy to Clipboard</button>
        <button class="scriptify-btn" id="downloadBtn" title="Download script as file">⬇️ Download Script</button>
        <button class="scriptify-btn" id="clearBtn" title="Clear the output and reset timer">🧹 Clear Output</button>
      </div>

      <div id="scriptify-spinner" style="display: none; margin-top: 16px; text-align: center;">
  <div style="display: inline-flex; align-items: center; gap: 8px; justify-content: center;">
    <div class="spinner"></div>
    <div style="font-size: 13px; color: #888;">Enhancing with GPT...</div>
  </div>
</div>


<pre id="scriptify-output" style="max-height: 200px; overflow-y: auto; white-space: pre-wrap;">// Your test script will appear here...</pre>

      <div style="font-size: 11px; margin-top: 10px; color: #777;">
        🖱 Hover over any button to see what it does.
      </div>
    </div>
    <span id="scriptify-timer" style="font-size: 13px; font-weight: bold; color: #888;">⏱ 00:00</span>
  `;

  // Appends the panel to the document body
  document.body.appendChild(panel);

  // --- Timer Variables and Functions ---
  // Manages the recording timer display.
  let timerInterval = null;
  let seconds = 0;
  const timerDisplay = document.getElementById("scriptify-timer");
  const scriptifyOutput = document.getElementById("scriptify-output"); // Cache output element

  // Resets the timer to 00:00 and clears the interval.
  function resetTimer() {
    clearInterval(timerInterval);
    seconds = 0;
    timerDisplay.textContent = "⏱ 00:00";
    timerDisplay.style.color = "#888";
  }

  // Starts the timer, updating the display every second.
  function startTimer() {
    resetTimer(); // Ensure it's reset before starting
    timerDisplay.style.color = "#28a745"; // Green for recording
    timerInterval = setInterval(() => {
      seconds++;
      const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
      const secs = String(seconds % 60).padStart(2, '0');
      timerDisplay.textContent = `⏱ ${mins}:${secs}`;
    }, 1000);
  }

  // Stops the timer and changes its color to indicate cessation.
  function stopTimer() {
    clearInterval(timerInterval);
    timerDisplay.style.color = "#e74c3c"; // Red for stopped
  }

  // --- Panel Dragging Functionality ---
  // Enables the user to drag the panel around the screen.
  panel.onmousedown = function (e) {
    // Calculate initial offset from mouse to panel edge
    let offsetX = e.clientX - panel.getBoundingClientRect().left;
    let offsetY = e.clientY - panel.getBoundingClientRect().top;

    // Updates panel position as mouse moves
    function onMouseMove(e) {
      panel.style.left = e.clientX - offsetX + "px";
      panel.style.top = e.clientY - offsetY + "px";
    }

    // Removes event listeners when mouse button is released
    function onMouseUp() {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    }

    // Adds event listeners for dragging
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // --- Button Handlers ---

  // Handles closing the panel
  document.getElementById("closeBtn").onclick = () => {
    panel.remove();
    window.scriptifyInjected = false; // Reset injection flag
    isScriptValid = false; // Clear script state on close
  };

  // Toggles panel minimization (hides/shows body content)
  let isMinimized = false;
  const minimizeBtn = document.getElementById("minimizeBtn");
  const bodyDiv = document.getElementById("scriptify-body");

  minimizeBtn.onclick = () => {
    isMinimized = !isMinimized;
    bodyDiv.style.display = isMinimized ? "none" : "block";
    minimizeBtn.textContent = isMinimized ? "➕" : "➖"; // Change button icon
  };

  // Initiates Playwright Codegen recording via backend server
  document.getElementById("recordBtn").onclick = () => {
    const targetUrl = window.location.href;
    fetch("http://localhost:4000/codegen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: targetUrl }),
    })
      .then((res) => res.json())
      .then((data) => {
        scriptifyOutput.textContent =
          data.script || "✅ Launching Playwright Codegen. You can now begin recording your actions.";
        isScriptValid = true; // Mark as valid script placeholder
        startTimer();
      })
      .catch((err) => {
        scriptifyOutput.textContent =
          "❌ Error contacting backend. Make sure to start the server with `node codegen-server.js`.\n\n" +
          (err.message || err);
        isScriptValid = false; // Mark as invalid/error content
      });
  };

  // Stops recording and saves the script via backend server
  document.getElementById("stopBtn").onclick = () => {
    const finalScript = scriptifyOutput.textContent;

    // Basic check: if it's the initial placeholder or an error message, don't save
    if (!isScriptValid || finalScript === "// Your test script will appear here...") {
        scriptifyOutput.textContent = "⚠️ No active recording or valid script to save. Start recording first.";
        isScriptValid = false;
        return;
    }

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
              scriptifyOutput.textContent = script;
              isScriptValid = true; // Successfully saved, content is a script
              stopTimer();
            });
        } else {
          scriptifyOutput.textContent = "❌ Failed to save script.";
          isScriptValid = false; // Failed to save, content is an error
        }
      })
      .catch((err) => {
        scriptifyOutput.textContent =
          "❌ Save operation failed: Recording must be initiated before saving the script.\n\n" +
          (err.message || err);
        isScriptValid = false; // Failed to save, content is an error
      });
  };

  // Sends the current script to GPT for enhancement via backend server
  document.getElementById("gptEnhanceBtn").onclick = () => {
    const rawScript = scriptifyOutput.textContent;
    const spinner = document.getElementById("scriptify-spinner");

    // Check if there's a valid script to enhance
    if (!isScriptValid || rawScript === "// Your test script will appear here...") {
      scriptifyOutput.textContent = "⚠️ No valid script to enhance. Record a script first.";
      isScriptValid = false;
      return;
    }

    spinner.style.display = "block"; // Show spinner

    fetch("http://localhost:4000/gpt/enhance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ script: rawScript }),
    })
      .then((res) => res.json())
      .then((data) => {
        scriptifyOutput.textContent =
          data.enhanced || "❌ GPT returned nothing. It might be an issue with API key or prompt.";
        isScriptValid = !!data.enhanced; // Mark as valid if data.enhanced exists, false otherwise
      })
      .catch((err) => {
        scriptifyOutput.textContent =
          "❌ GPT enhancement failed: Required script not found or backend error.\n\n" +
          (err.message || err);
        isScriptValid = false; // Mark as invalid/error content
      })
      .finally(() => {
        spinner.style.display = "none"; // Hide spinner
      });
  };

  // Copies the current script to the clipboard
  document.getElementById("copyBtn").onclick = () => {
    const script = scriptifyOutput.textContent.trim();

    // Only allow copying if the content is marked as a valid script
    if (!isScriptValid || !script || script === "// Your test script will appear here...") {
      scriptifyOutput.textContent = "⚠️ No valid script found to copy. Record or enhance a script first.";
      // Do NOT set isScriptValid to false here if it was already false, to preserve error message state.
      // If it was true but now empty/placeholder, then set to false.
      if (script === "// Your test script will appear here...") isScriptValid = false;
      return;
    }

    navigator.clipboard.writeText(script)
      .then(() => {
        // Clear previous messages before adding success message if it was an error
        if (!script.startsWith('// Your test script will appear here...') && !script.startsWith('❌ Error:')) {
          scriptifyOutput.textContent = script + "\n\n✅ Copied to clipboard.";
        } else {
           // If it was a script, append. If it was an error/placeholder, just show success.
           scriptifyOutput.textContent = script + "\n\n✅ Copied to clipboard.";
        }
      })
      .catch((err) => {
        scriptifyOutput.textContent = `❌ Failed to copy script.\n\n${err.message || err}`;
        isScriptValid = false; // Copy failed, content might be invalid
      });
  };

  // Downloads the current script as a text file
  document.getElementById("downloadBtn").onclick = () => {
    const script = scriptifyOutput.textContent.trim();

    // Only allow downloading if the content is marked as a valid script
    if (!isScriptValid || !script || script === "// Your test script will appear here...") {
      scriptifyOutput.textContent = "❌ Error: No valid script found to download. Please record or enhance a script first.";
      // Do NOT set isScriptValid to false here if it was already false, to preserve error message state.
      // If it was true but now empty/placeholder, then set to false.
      if (script === "// Your test script will appear here...") isScriptValid = false;
      return;
    }

    // Proceed with download if script exists
    const blob = new Blob([script], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "test-script.js"; // Suggest .js extension for Playwright scripts
    a.click();
    // Clean up the URL object to free memory
    URL.revokeObjectURL(a.href);

    // Optional: Provide feedback to the user
    // Clear previous messages before adding success message if it was an error
    if (!script.startsWith('// Your test script will appear here...') && !script.startsWith('❌ Error:')) {
      scriptifyOutput.textContent = script + "\n\n✅ Script downloaded.";
    } else {
       // If it was a script, append. If it was an error/placeholder, just show success.
       scriptifyOutput.textContent = script + "\n\n✅ Script downloaded.";
    }
  };

  // Clears the output area and resets the timer
  document.getElementById("clearBtn").onclick = () => {
    scriptifyOutput.textContent = "// Your test script will appear here...";
    isScriptValid = false; // No valid script after clearing
    resetTimer();
  };
})();