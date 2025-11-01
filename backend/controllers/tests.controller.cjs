// backend/controllers/tests.controller.js
const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Import utilities
const logger = require('../utils/logger.cjs');
const ErrorHandler = require('../utils/error-handler.cjs');
const { PATHS, DEFAULT_CONFIG } = require('../config/constants.cjs');
const { ConsoleHelper, MODULES } = require('../utils/console-helper.cjs');

class TestsController {
  constructor() {
    this.testsDir = PATHS.TESTS;
    this.reportsDir = PATHS.REPORTS;
    this.resultsDir = path.join(PATHS.ROOT, 'test-results');
  }

  async runTests(req, res) {
    try {
      ConsoleHelper.log(MODULES.TESTS, 'Run tests requested');
      
      const { 
        browser = 'chromium',
        headless = false,
        parallel = 1,
        tags = '',
        video = false,
        screenshots = false
      } = req.body;

      // Validate browser type
      const validBrowsers = ['chromium', 'firefox', 'webkit'];
      if (browser && !validBrowsers.includes(browser)) {
        return res.status(400).json({
          error: 'Invalid browser type',
          message: `Browser must be one of: ${validBrowsers.join(', ')}`
        });
      }

      // Validate parallel count
      if (parallel && (isNaN(parallel) || parallel < 1)) {
        return res.status(400).json({
          error: 'Invalid parallel count',
          message: 'Parallel count must be a positive number'
        });
      }

      // Find the latest test file
      const latestTestFile = await this.findLatestTCSTest();
      if (!latestTestFile) {
        ConsoleHelper.error(MODULES.TESTS, 'No test files found');
        return res.status(404).json({
          error: "No test files found",
          message: "Please enhance a script first to create test files. Looking in: " + this.testsDir
        });
      }

      ConsoleHelper.log(MODULES.TESTS, `Found test file: ${latestTestFile}`);
      logger.info('Found latest TCS test', { testFile: latestTestFile });

      // Clean cache folders before running tests
      await this.cleanCacheFolders();

      // Prepare reports directory (including screenshots/videos/logs)
      await this.prepareReportsDirectory();
      
      // Ensure directory exists right before test execution
      await this.ensureReportDirectoryExists();

      // Clean cache folders before test execution
      await this.cleanCacheFolders();
      
      // Execute Python tests (only the latest TCS test)
      ConsoleHelper.log(MODULES.TESTS, `Executing tests (${browser}, ${headless ? 'headless' : 'headed'})...`);
      
      // Print to IDE console with immediate flush
      // Write to both stdout and stderr to ensure visibility even if stdout is redirected
      const headerMsg = `\n🧪 ========================================\n🧪 Starting Test Execution\n🧪 ========================================\n📋 Test File: ${latestTestFile}\n🌐 Browser: ${browser} (${headless ? 'headless' : 'headed'})\n🧪 ========================================\n\n`;
      process.stdout.write(headerMsg);
      process.stderr.write(headerMsg);  // Also write to stderr so it appears in terminal
      
      const result = await this.executeTests({
        browser,
        headless,
        parallel,
        tags,
        video,
        screenshots,
        testFile: latestTestFile
      });

      if (result.exitCode === 0) {
        ConsoleHelper.success(MODULES.TESTS, `Tests completed (${result.duration}ms)`);
      } else {
        ConsoleHelper.error(MODULES.TESTS, `Tests failed (exit code: ${result.exitCode})`);
      }

      logger.success('Tests executed successfully', { 
        exitCode: result.exitCode,
        duration: result.duration 
      });

      // Include stdout/stderr in response for debugging, plus progress lines
      res.json({
        success: result.exitCode === 0,
        message: result.exitCode === 0 ? "Tests executed successfully" : "Tests failed",
        data: {
          exitCode: result.exitCode,
          duration: result.duration,
          testFile: latestTestFile,
          reportsDir: this.reportsDir,
          timestamp: new Date().toISOString(),
          stdout: result.stdout ? result.stdout.substring(0, 10000) : '', // Include last 10KB of output
          stderr: result.stderr ? result.stderr.substring(0, 10000) : '', // Include last 10KB of errors
          progress: result.outputLines || [], // Real-time progress lines
          error: result.exitCode !== 0 ? result.stderr || result.stdout : undefined
        }
      });

    } catch (error) {
      ConsoleHelper.error(MODULES.TESTS, `Test execution failed: ${error.message}`);
      logger.error('Test execution failed', { error: error.message });
      ErrorHandler.handleError(error, req, res);
    }
  }

  async findLatestTCSTest() {
    try {
      // Get all test files in the tests directory
      // Look for any test_*.py file (not just files with "tcs" in name)
      const files = await fs.readdir(this.testsDir);
      const testFiles = files.filter(file => 
        file.endsWith('.py') && 
        file.startsWith('test_') &&
        file !== 'conftest.py' // Exclude conftest.py
      );

      if (testFiles.length === 0) {
        return null;
      }

      // Get file stats to find the most recently modified
      const fileStats = await Promise.all(
        testFiles.map(async (file) => {
          const filePath = path.join(this.testsDir, file);
          const stats = await fs.stat(filePath);
          return {
            name: file,
            path: filePath,
            mtime: stats.mtime
          };
        })
      );

      // Sort by modification time (newest first)
      fileStats.sort((a, b) => b.mtime - a.mtime);
      
      const latestFile = fileStats[0];
      logger.info('Latest test file found', { 
        fileName: latestFile.name,
        modified: latestFile.mtime.toISOString()
      });

      return latestFile.name;
    } catch (error) {
      ConsoleHelper.error(MODULES.TESTS, `Failed to find test files: ${error.message}`);
      logger.error('Failed to find latest test file', { error: error.message });
      return null;
    }
  }

  async cleanCacheFolders() {
    try {
      // Comprehensive cache directory cleanup - clean recursively from root
      const cacheDirs = [
        // Direct cache folders
        path.join(this.testsDir, '__pycache__'),
        path.join(this.testsDir, '.pytest_cache'),
        path.join(PATHS.TEST_CASES, '__pycache__'),
        path.join(PATHS.TEST_CASES, '.pytest_cache'),
        path.join(PATHS.ROOT, '__pycache__'),
        path.join(PATHS.ROOT, '.pytest_cache'),
        // Test cases subdirectories
        path.join(PATHS.TEST_CASES, 'pages', '__pycache__'),
        path.join(PATHS.TEST_CASES, 'pages', '.pytest_cache'),
        path.join(PATHS.TEST_CASES, 'tests', '__pycache__'),
        path.join(PATHS.TEST_CASES, 'tests', '.pytest_cache'),
        path.join(PATHS.TEST_CASES, 'utils', '__pycache__'),
        path.join(PATHS.TEST_CASES, 'utils', '.pytest_cache'),
        path.join(PATHS.TEST_CASES, 'data', '__pycache__'),
        path.join(PATHS.TEST_CASES, 'data', '.pytest_cache'),
        path.join(PATHS.TEST_CASES, 'config', '__pycache__'),
        path.join(PATHS.TEST_CASES, 'config', '.pytest_cache'),
      ];

      for (const cacheDir of cacheDirs) {
        try {
          const exists = fsSync.existsSync(cacheDir);
          if (exists) {
            await fs.rm(cacheDir, { recursive: true, force: true });
            ConsoleHelper.log(MODULES.TESTS, `🧹 Cleaned cache: ${cacheDir}`);
          }
        } catch (error) {
          // Ignore errors if directory doesn't exist or can't be deleted
          ConsoleHelper.warning(MODULES.TESTS, `⚠️ Could not clean ${cacheDir}: ${error.message}`);
        }
      }

      // Also clean any __pycache__ folders recursively
      await this.cleanCacheRecursive(PATHS.ROOT);
      
      logger.info('Cache folders cleaned');
      ConsoleHelper.log(MODULES.TESTS, '✅ All cache folders cleaned');
    } catch (error) {
      logger.warn('Failed to clean some cache folders', { error: error.message });
      ConsoleHelper.warning(MODULES.TESTS, `⚠️ Cache cleanup warning: ${error.message}`);
    }
  }

  async cleanCacheRecursive(dir) {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === '__pycache__' || entry.name === '.pytest_cache') {
            try {
              await fs.rm(fullPath, { recursive: true, force: true });
              ConsoleHelper.log(MODULES.TESTS, `🧹 Cleaned: ${fullPath}`);
            } catch (error) {
              // Ignore errors
            }
          } else if (entry.name !== 'node_modules' && entry.name !== 'venv' && entry.name !== '.git') {
            // Recursively clean subdirectories (but skip node_modules, venv, .git)
            await this.cleanCacheRecursive(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore errors - directory might not exist or not be readable
    }
  }

  async prepareReportsDirectory() {
    try {
      // Ensure parent directory exists first
      const parentDir = path.dirname(this.reportsDir);
      await fs.mkdir(parentDir, { recursive: true });
      
      // Ensure the reports directory exists (create if it doesn't)
      await fs.mkdir(this.reportsDir, { recursive: true });
      
      // Ensure analytics directory exists
      const analyticsDir = path.join(this.resultsDir, 'analytics');
      await fs.mkdir(analyticsDir, { recursive: true });
      
      // Ensure screenshots and videos directories exist
      await fs.mkdir(path.join(this.resultsDir, 'screenshots'), { recursive: true });
      await fs.mkdir(path.join(this.resultsDir, 'videos'), { recursive: true });
      
      logger.info('Reports directory prepared', { path: this.reportsDir });
    } catch (error) {
      ConsoleHelper.error(MODULES.TESTS, `Failed to prepare reports directory: ${error.message}`);
      throw new Error(`Failed to prepare reports directory: ${error.message}`);
    }
  }

  async executeTests(options) {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      // Build pytest command parts
      const commandParts = this.buildPytestCommandParts(options);
      const [pythonPath, ...args] = commandParts;
      
      logger.info('Executing Python tests', { command: commandParts.join(' ') });
      
      // Use spawn for real-time output streaming
      // IMPORTANT: Remove PYTEST_DISABLE_PLUGIN_AUTOLOAD to allow pytest-html plugin to load
      const testEnv = { ...process.env };
      delete testEnv.PYTEST_DISABLE_PLUGIN_AUTOLOAD;  // Ensure pytest-html plugin can auto-register
      
      const testProcess = spawn(pythonPath, args, {
        cwd: PATHS.ROOT,  // Run from project root (not test-cases) for proper imports
        env: {
          ...testEnv,
          PYTHONDONTWRITEBYTECODE: '1',
          PYTHONUNBUFFERED: '1',  // Critical: Unbuffered output for real-time streaming
          PYTEST_CACHE_DIR: '/dev/null',
          BROWSER_TYPE: options.browser,
          HEADLESS: options.headless.toString(),
          RECORD_VIDEO: options.video.toString(),
          SCREENSHOT_ON_SUCCESS: options.screenshots.toString(),
          RECORD_VIDEO_ON_FAILURE: 'true',  // Always record videos on failure
          // pytest-playwright screenshot control (if needed to override pytest.ini)
          // PYTEST_SCREENSHOT: options.screenshots ? 'on' : 'only-on-failure'
        },
        stdio: ['pipe', 'pipe', 'pipe']  // Capture stdout and stderr
      });
      
      let stdout = '';
      let stderr = '';
      let outputLines = [];
      const maxOutputLines = 1000;  // Keep last 1000 lines
      
      // Capture stdout line by line for progress tracking
      testProcess.stdout.on('data', (data) => {
        const chunk = data.toString();
        stdout += chunk;
        
        // Split into lines and track progress
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            outputLines.push({ type: 'stdout', line: line.trim(), timestamp: Date.now() });
            // Keep only last maxOutputLines
            if (outputLines.length > maxOutputLines) {
              outputLines.shift();
            }
            
            // Print to IDE console in real-time (flush immediately)
            // Write to both stdout and stderr to ensure visibility even if stdout is redirected
            const outputLine = `📋 ${line.trim()}\n`;
            process.stdout.write(outputLine);
            process.stderr.write(outputLine);  // Also write to stderr so it appears in terminal
          }
        }
        
        // Also log via ConsoleHelper for structured logging
        ConsoleHelper.log(MODULES.TESTS, `[PROGRESS] ${lines[lines.length - 1]?.trim() || ''}`);
      });
      
      // Capture stderr line by line
      testProcess.stderr.on('data', (data) => {
        const chunk = data.toString();
        stderr += chunk;
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.trim()) {
            outputLines.push({ type: 'stderr', line: line.trim(), timestamp: Date.now() });
            if (outputLines.length > maxOutputLines) {
              outputLines.shift();
            }
            
            // Print to IDE console in real-time with warning icon (flush immediately)
            const errorLine = `⚠️  ${line.trim()}\n`;
            process.stderr.write(errorLine);
            // Also write to stdout to ensure visibility if stderr is redirected
            process.stdout.write(errorLine);
          }
        }
        
        // Also log via ConsoleHelper for structured logging
        ConsoleHelper.warning(MODULES.TESTS, `[ERROR] ${lines[lines.length - 1]?.trim() || ''}`);
      });
      
      // Handle process completion
      testProcess.on('close', async (code) => {
        const duration = Date.now() - startTime;
        const durationSeconds = (duration / 1000).toFixed(2);
        
        // Clean cache folders after test execution
        await this.cleanCacheFolders();
        
        // Verify HTML report was created after test execution
        const reportPath = path.join(PATHS.ROOT, 'test-results', 'reports', 'pytest-report.html');
        try {
          await fs.access(reportPath);
          ConsoleHelper.log(MODULES.TESTS, `✅ HTML report generated: ${reportPath}`);
        } catch {
          ConsoleHelper.warning(MODULES.TESTS, `⚠️  HTML report not found at: ${reportPath}`);
          ConsoleHelper.warning(MODULES.TESTS, 'This may affect analytics generation. Ensure pytest-html is installed.');
        }
        
        // Print completion summary with immediate flush
        // Write to both stdout and stderr to ensure visibility even if stdout is redirected
        const summaryMsg = `\n🧪 ========================================\n${code === 0 ? '✅ Test Execution Completed Successfully' : '❌ Test Execution Failed'}\n⏱️  Duration: ${durationSeconds}s${code !== 0 ? `\n📊 Exit Code: ${code}` : ''}\n🧪 ========================================\n\n`;
        process.stdout.write(summaryMsg);
        process.stderr.write(summaryMsg);  // Also write to stderr so it appears in terminal
        
        if (code === 0) {
          
          logger.info('Test execution completed', { 
            duration: `${duration}ms`,
            stdout: stdout.substring(0, 500) + (stdout.length > 500 ? '...' : ''),
            stderr: stderr.substring(0, 200) + (stderr.length > 200 ? '...' : '')
          });

          resolve({
            exitCode: 0,
            duration,
            stdout,
            stderr,
            outputLines: outputLines.slice(-50)  // Return last 50 lines for progress summary
          });
        } else {
          // Check if tests actually passed but report generation failed
          const testsPassed = stdout && (stdout.includes('PASSED') || stdout.includes('passed'));
          const reportFailure = stderr && stderr.includes('FileNotFoundError') && stderr.includes('pytest-report.html');
          
          if (testsPassed && reportFailure) {
            const msg = '⚠️  Tests passed but HTML report generation failed\n\n';
            process.stdout.write(msg);
            process.stderr.write(msg);  // Also write to stderr so it appears in terminal
            ConsoleHelper.warning(MODULES.TESTS, 'Tests passed but HTML report generation failed');
            resolve({
              exitCode: 0,
              duration,
              stdout,
              stderr: stderr + '\n[Note: HTML report generation failed, but tests passed successfully]',
              outputLines: outputLines.slice(-50)
            });
          } else {
            // Print last error lines to console for quick debugging
            // Write to both stdout and stderr to ensure visibility
            if (stderr) {
              const errorLines = stderr.split('\n').filter(l => l.trim()).slice(-10);
              if (errorLines.length > 0) {
                const header = '🔴 Last Error Lines:\n';
                process.stdout.write(header);
                process.stderr.write(header);
                errorLines.forEach(line => {
                  const lineMsg = `   ${line}\n`;
                  process.stderr.write(lineMsg);
                  process.stdout.write(lineMsg);
                });
              }
            }
            
            logger.error('Test execution failed', { 
              code,
              duration: `${duration}ms`,
              stdout: stdout?.substring(0, 1000),
              stderr: stderr?.substring(0, 1000)
            });
            
            resolve({
              exitCode: code || 1,
              duration,
              stdout,
              stderr,
              outputLines: outputLines.slice(-50)  // Return last 50 lines for error analysis
            });
          }
        }
      });
      
      // Handle process errors
      testProcess.on('error', (error) => {
        const duration = Date.now() - startTime;
        logger.error('Test execution process error', { 
          error: error.message,
          duration: `${duration}ms`
        });
        
        resolve({
          exitCode: 1,
          duration,
          stdout,
          stderr: stderr || error.message,
          outputLines: outputLines.slice(-50)
        });
      });
    });
  }

  buildPytestCommandParts(options) {
    // Find Python executable - try venv first, then system Python
    let pythonPath;
    const venvPython = path.join(PATHS.ROOT, 'venv', 'bin', 'python');
    const venvPython3 = path.join(PATHS.ROOT, 'venv', 'bin', 'python3');
    
    // Check if venv Python exists
    if (fsSync.existsSync(venvPython)) {
      pythonPath = venvPython;
    } else if (fsSync.existsSync(venvPython3)) {
      pythonPath = venvPython3;
    } else {
      // Fallback to system python3
      pythonPath = 'python3';
      ConsoleHelper.warning(MODULES.TESTS, 'Using system python3 (venv not found)');
    }
    
    // Build command parts array (for spawn)
    const args = ['-m', 'pytest'];
    
    // Explicitly specify pytest.ini config file to ensure HTML report generation
    const pytestIniPath = path.join(PATHS.ROOT, 'pytest.ini');
    if (fsSync.existsSync(pytestIniPath)) {
      args.push('-c', pytestIniPath);
    }
    
    // Run specific test file if provided, otherwise run all tests
    const testTarget = options.testFile ? `test-cases/tests/${options.testFile}` : 'test-cases/tests/';
    args.push(testTarget);
    args.push('-v');  // Verbose output
    
    // Add browser option for pytest-playwright
    if (options.browser !== 'chromium') {
      args.push(`--browser=${options.browser}`);
    }
    
    // Add headless option for pytest-playwright
    // Note: pytest-playwright only supports --headless flag, not --headed
    // To run in headed mode, simply don't add --headless flag
    if (options.headless) {
      args.push('--headless');
    }
    // If headless is false, don't add any flag - pytest-playwright runs headed by default
    
    // Add parallel execution
    if (options.parallel > 1) {
      args.push('-n', options.parallel.toString());
    }
    
    // Add tags filter
    if (options.tags) {
      args.push('-m', options.tags);
    }
    
    // Note: Video and screenshots are configured in pytest.ini
    // pytest-playwright doesn't support --video or --screenshot as command-line arguments
    // These are configured in pytest.ini under [tool:pytest-playwright] section:
    //   screenshot = on-failure
    //   video = on-failure
    // The pytest.ini settings will handle screenshot/video capture automatically
    // We don't need to pass these as command-line arguments
    
    // Ensure HTML report is generated - explicitly add it even if in pytest.ini
    // This ensures the report is always created even if pytest.ini isn't loaded correctly
    // Use absolute path to ensure report is saved in the correct location
    const reportsDir = path.join(PATHS.ROOT, 'test-results', 'reports');
    const reportPath = path.join(reportsDir, 'pytest-report.html');
    args.push('--html', reportPath);
    args.push('--self-contained-html');
    
    // Log the report path for debugging
    ConsoleHelper.log(MODULES.TESTS, `HTML report will be saved to: ${reportPath}`);
    
    // Add explicit cache prevention (also in pytest.ini but ensure it's there)
    args.push('--cache-disable');
    args.push('--cache-clear');  // Clear any existing cache
    
    return [pythonPath, ...args];
  }
  
  // Legacy method for backward compatibility (returns string command)
  buildPytestCommand(options) {
    const parts = this.buildPytestCommandParts(options);
    return parts.join(' ');
  }
  
  // Helper method to ensure report directory exists before pytest runs
  async ensureReportDirectoryExists() {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
      // Touch the directory to ensure it's writable
      await fs.access(this.reportsDir);
    } catch (error) {
      ConsoleHelper.warning(MODULES.TESTS, `Could not ensure report directory: ${error.message}`);
    }
  }

  async getTestStatus(req, res) {
    try {
      // Check if tests directory exists
      let hasTestAssets = false;
      try {
        await fs.access(this.testsDir);
        const files = await fs.readdir(this.testsDir);
        hasTestAssets = files.some(file => file.endsWith('.py') && file.startsWith('test_'));
      } catch {
        hasTestAssets = false;
      }

      // Check if reports exist
      let hasReports = false;
      try {
        await fs.access(this.reportsDir);
        const files = await fs.readdir(this.reportsDir);
        hasReports = files.length > 0;
      } catch {
        hasReports = false;
      }

      const status = {
        hasTestAssets,
        hasReports,
        canRunTests: hasTestAssets,
        status: hasTestAssets ? 'ready' : 'no_tests',
        testsDirectory: this.testsDir,
        reportsDirectory: this.reportsDir
      };

      res.json(status);
    } catch (error) {
      ErrorHandler.handleError(error, req, res);
    }
  }

  async getTestResults(req, res) {
    try {
      // Get test files
      let testFiles = [];
      try {
        const files = await fs.readdir(this.testsDir);
        testFiles = files.filter(file => file.endsWith('.py') && file.startsWith('test_'));
      } catch {
        testFiles = [];
      }

      // Get HTML report info
      let htmlReport = null;
      try {
        const reportPath = path.join(this.reportsDir, 'pytest-report.html');
        await fs.access(reportPath);
        htmlReport = reportPath;
      } catch {
        htmlReport = null;
      }

      res.json({
        testFiles,
        htmlReport,
        testsDirectory: this.testsDir,
        reportsDirectory: this.reportsDir
      });
    } catch (error) {
      ErrorHandler.handleError(error, req, res);
    }
  }
}

// Create controller instance and bind methods
const testsController = new TestsController();

module.exports = {
  runTests: ErrorHandler.asyncHandler(testsController.runTests.bind(testsController)),
  getTestStatus: ErrorHandler.asyncHandler(testsController.getTestStatus.bind(testsController)),
  getTestResults: ErrorHandler.asyncHandler(testsController.getTestResults.bind(testsController))
};