const { spawn } = require("child_process");
const fs = require("fs").promises;
const path = require("path");

// Import utilities
const logger = require("../utils/logger.cjs");
const ErrorHandler = require("../utils/error-handler.cjs");
const { PATHS, FILE_NAMES, DEFAULT_CONFIG } = require("../config/constants.cjs");
const { ConsoleHelper, MODULES } = require("../utils/console-helper.cjs");

class RecorderController {
  constructor() {
    this.codegenProcess = null;
    this.recordingsDir = PATHS.RECORDINGS;
    this.rawScriptPath = path.join(this.recordingsDir, FILE_NAMES.RAW_SCRIPT);
    this.ensureDirectoriesExist();
  }

  async ensureDirectoriesExist() {
    try {
      await fs.mkdir(this.recordingsDir, { recursive: true });
    } catch (error) {
      ConsoleHelper.error(MODULES.RECORDER, `Failed to create recordings directory: ${error.message}`);
      logger.error('Failed to create recordings directory', error);
      throw error;
    }
  }

  async startRecording(req, res) {
    // Check if recording already in progress
    if (this.codegenProcess) {
      ConsoleHelper.error(MODULES.RECORDER, 'Recording already in progress');
      return res.status(409).json({ 
        error: "Recording already in progress",
        message: "Please stop the current recording before starting a new one"
      });
    }

    const { url } = req.body;
    ConsoleHelper.log(MODULES.RECORDER, `Starting recording for: ${url}`);
    logger.info('Starting Playwright recording', { url });

    // Start Playwright codegen process - spawn is synchronous
    try {
      this.codegenProcess = spawn("npx", [
        "playwright",
        "codegen",
        "--output",
        this.rawScriptPath,
        "--target",
        "python-pytest",
        url
      ], {
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: false
      });

      ConsoleHelper.log(MODULES.RECORDER, `Recording started (PID: ${this.codegenProcess.pid})`);
    } catch (spawnErr) {
      ConsoleHelper.error(MODULES.RECORDER, `Failed to start recording: ${spawnErr.message}`);
      return res.status(500).json({
        error: "Failed to start recording",
        message: `Failed to spawn Playwright codegen: ${spawnErr.message}`
      });
    }

    // CRITICAL: Send success response IMMEDIATELY after spawn
    // This MUST happen synchronously before any other operations
    const response = { 
      message: "Playwright codegen recording started successfully",
      url,
      status: "recording"
    };
    
    ConsoleHelper.success(MODULES.RECORDER, 'Recording started successfully');
    
    // Send response IMMEDIATELY - this is critical
    try {
      res.json(response);
    } catch (sendErr) {
      ConsoleHelper.error(MODULES.RECORDER, `Error sending response: ${sendErr.message}`);
      // If we can't send response, something is seriously wrong
      // But codegen is already running, so we can't stop it here
      return;
    }
    
    // NOW set up event handlers AFTER response is sent
    // Use setTimeout(0) to defer this to next tick
    setTimeout(() => {
      try {
        if (this.codegenProcess) {
          // Handle spawn errors (e.g., command not found)
          this.codegenProcess.on("error", (error) => {
            ConsoleHelper.error(MODULES.RECORDER, `Process error: ${error.message}`);
            logger.error('Codegen process spawn error', error);
            this.codegenProcess = null;
          });

          this.codegenProcess.stdout.on("data", (data) => {
            logger.debug('Codegen stdout', { data: data.toString() });
          });

          this.codegenProcess.stderr.on("data", (data) => {
            logger.warn('Codegen stderr', { data: data.toString() });
          });

          this.codegenProcess.on("close", (code) => {
            ConsoleHelper.log(MODULES.RECORDER, `Recording stopped (exit code: ${code})`);
            logger.info('Codegen process closed', { exitCode: code });
            this.codegenProcess = null;
          });

          // Unref the process so it doesn't keep the Node.js process alive
          try {
            this.codegenProcess.unref();
          } catch (unrefErr) {
            // Silent fail
          }

          // Set timeout for recording
          setTimeout(() => {
            if (this.codegenProcess) {
              ConsoleHelper.warning(MODULES.RECORDER, 'Recording timeout reached');
              logger.warn('Recording timeout reached, stopping process');
              this.stopRecordingProcess();
            }
          }, DEFAULT_CONFIG.RECORDING.TIMEOUT);
        }
      } catch (setupErr) {
        // Log but don't throw - response already sent
        ConsoleHelper.error(MODULES.RECORDER, `Error setting up handlers: ${setupErr.message}`);
      }
    }, 0);
  }

  async stopRecording(req, res) {
    try {
      ConsoleHelper.log(MODULES.RECORDER, 'Stop recording requested');
      
      if (!this.codegenProcess) {
        ConsoleHelper.error(MODULES.RECORDER, 'No recording in progress');
        return res.status(400).json({ 
          error: "No recording in progress",
          message: "Please start a recording first"
        });
      }

      ConsoleHelper.log(MODULES.RECORDER, 'Stopping recording...');
      logger.info('Stopping Playwright recording');
      this.stopRecordingProcess();

      // Wait for file to be written
      await this.waitForFile(this.rawScriptPath, 3000);

      // Read the generated script
      let rawScript = await fs.readFile(this.rawScriptPath, "utf-8");
      
      if (!rawScript.trim()) {
        ConsoleHelper.error(MODULES.RECORDER, 'Empty script generated');
        return res.status(500).json({ 
          error: "Empty script generated",
          message: "The recording did not capture any interactions"
        });
      }

      // Clean the script by removing imports and function wrapper
      rawScript = this.cleanRawScript(rawScript);
      
      // Save the cleaned script
      await fs.writeFile(this.rawScriptPath, rawScript);

      ConsoleHelper.success(MODULES.RECORDER, `Script saved (${rawScript.length} chars)`);
      
      logger.success('Recording stopped and script saved', { 
        scriptLength: rawScript.length 
      });

      res.json({ 
        rawScript, 
        message: "Recording stopped and script saved successfully",
        status: "completed"
      });

    } catch (error) {
      ConsoleHelper.error(MODULES.RECORDER, `Stop recording failed: ${error.message}`);
      logger.error('Failed to stop recording', error);
      ErrorHandler.handleError(error, req, res);
    }
  }

  stopRecordingProcess() {
    if (this.codegenProcess) {
      this.codegenProcess.kill("SIGINT");
      this.codegenProcess = null;
    }
  }

  async waitForFile(filePath, timeout = 5000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        await fs.access(filePath);
        return true;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    throw new Error(`File ${filePath} not found within ${timeout}ms`);
  }

  cleanRawScript(rawScript) {
    // Remove imports and function wrapper, keep only the action lines
    const lines = rawScript.split('\n');
    const actionLines = [];
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Skip empty lines, imports, and function definitions
      if (trimmedLine === '' || 
          trimmedLine.startsWith('import ') || 
          trimmedLine.startsWith('from ') ||
          trimmedLine.startsWith('def ') ||
          trimmedLine.startsWith('"""') ||
          trimmedLine.startsWith("'''")) {
        continue;
      }
      
      // Keep action lines (page.goto, page.locator, page.get_by_role, etc.)
      if (trimmedLine.startsWith('page.')) {
        actionLines.push(trimmedLine);
      }
    }
    
    return actionLines.join('\n');
  }

  getStatus(req, res) {
    res.json({
      isRecording: !!this.codegenProcess,
      status: this.codegenProcess ? "recording" : "idle"
    });
  }
}

const controller = new RecorderController();

// Wrap startRecording to ensure response is sent even if async operations fail
const wrappedStartRecording = async (req, res) => {
  try {
    await controller.startRecording(req, res);
  } catch (error) {
    // Only handle error if response hasn't been sent
    if (!res.headersSent) {
      ConsoleHelper.error(MODULES.RECORDER, `Start recording error: ${error.message}`);
      ErrorHandler.handleError(error, req, res);
    } else {
      logger.debug('Error after response sent (ignored)', { error: error?.message });
    }
  }
};

module.exports = {
  startRecording: wrappedStartRecording,
  stopRecording: ErrorHandler.asyncHandler(controller.stopRecording.bind(controller)),
  getStatus: controller.getStatus.bind(controller)
};
