// enhancer-wrapper.cjs
// Production-Grade CommonJS Wrapper for ES Module Enhancer
// ========================================================
//
// Features:
// - Enhanced API communication with status updates
// - Rich error reporting with file/line/cause
// - Console logging only (no file logs)
// - Async file I/O
// - Progress tracking
// - Two-way communication support

const path = require('path');

// Dynamic import for ES module
let enhanceScriptFunction = null;
let getEnhancementStatusFunction = null;

// Console-only logging (no file logging)
function writeLog(level, message, data = null) {
  const consoleMethod = level === 'ERROR' ? console.error : level === 'WARN' ? console.warn : console.log;
  consoleMethod(`[${level}] ${message}`, data || '');
}

async function loadEnhancerModule() {
  if (!enhanceScriptFunction) {
    try {
      const module = await import('./enhancer.controller.js');
      enhanceScriptFunction = module.enhanceScript;
      await writeLog('INFO', 'Enhancer module loaded successfully');
    } catch (err) {
      await writeLog('ERROR', 'Failed to load enhancer module', { error: err.message });
      throw err;
    }
    
    // Create a status function if not exported
    getEnhancementStatusFunction = async (req, res) => {
      const path = require('path');
      const fs = require('fs').promises;
      const { FILE_NAMES } = require('../config/constants.cjs');
      
      try {
        const recordingsDir = path.resolve(__dirname, '../../test-cases/raw');
        const rawScriptPath = path.join(recordingsDir, FILE_NAMES.RAW_SCRIPT);
        let hasRawScript = false;
        
        try {
          await fs.access(rawScriptPath);
          hasRawScript = true;
        } catch {
          hasRawScript = false;
        }
        
        res.json({
          hasRawScript,
          rawScriptPath: hasRawScript ? rawScriptPath : null,
          status: 'ready'
        });
      } catch (err) {
        await writeLog('ERROR', 'Status check failed', { error: err.message });
        res.status(500).json({ error: err.message });
      }
    };
  }
  return { enhanceScriptFunction, getEnhancementStatusFunction };
}

// Improvement #20, #21: Enhanced API communication with status updates
async function enhanceScript(req, res) {
  const startTime = Date.now();
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  await writeLog('INFO', 'Enhancement request received', { requestId });
  
  try {
    const { enhanceScriptFunction } = await loadEnhancerModule();
    
    // Extract options from request
    const options = {
      incremental: req.body.incremental === true,
      dryRun: req.body.dryRun === true,
      ...req.body.options
    };
    
    // Extract file path
    let rawScriptPath = null;
    
    if (req.body && req.body.file) {
      rawScriptPath = req.body.file;
    } else {
      // Auto-detect from default location
      const path = require('path');
      const fs = require('fs').promises;
      const { FILE_NAMES } = require('../config/constants.cjs');
      
      const defaultLocations = [
        path.resolve(__dirname, '../../test-cases/raw', FILE_NAMES.RAW_SCRIPT),
        path.resolve(__dirname, '../../test-cases/recordings', FILE_NAMES.RAW_SCRIPT)
      ];
      
      for (const location of defaultLocations) {
        try {
          await fs.access(location);
          rawScriptPath = location;
          await writeLog('INFO', 'Auto-detected raw script', { path: rawScriptPath });
          break;
        } catch {
          continue;
        }
      }
      
      if (!rawScriptPath) {
        await writeLog('WARN', 'Raw script not found', { locations: defaultLocations });
        return res.status(400).json({
          success: false,
          error: 'Raw script not found',
          message: `Please ensure raw_script.py exists in test-cases/raw/ or test-cases/recordings/`,
          requestId
        });
      }
    }
    
    // Improvement #21: Send progress updates via SSE or status polling
    // For now, we'll return a detailed response with progress info
    
    await writeLog('INFO', 'Starting enhancement', { 
      requestId, 
      scriptPath: rawScriptPath,
      options 
    });
    
    // Call enhancer with options
    const result = await enhanceScriptFunction(rawScriptPath, options);
    
    const duration = Date.now() - startTime;
    
    await writeLog('INFO', 'Enhancement completed', {
      requestId,
      duration: `${duration}ms`,
      filesCreated: result.summary?.filesCreated?.length || 0,
      filesUpdated: result.summary?.filesUpdated?.length || 0,
      errors: result.summary?.errors?.length || 0
    });
    
    // Improvement #22: Rich error reporting
    if (result.summary && result.summary.errors && result.summary.errors.length > 0) {
      await writeLog('WARN', 'Enhancement completed with errors', {
        requestId,
        errors: result.summary.errors
      });
      
      return res.status(200).json({
        success: result.success,
        requestId,
        message: 'Enhancement completed with some errors',
        data: result.details,
        summary: result.summary,
        errors: result.summary.errors.map(err => ({
          message: err,
          type: 'validation',
          timestamp: new Date().toISOString()
        }))
      });
    }
    
    res.json({
      success: true,
      requestId,
      message: "Enhancement completed successfully",
      data: result.details,
      summary: result.summary,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });
    
  } catch (err) {
    const duration = Date.now() - startTime;
    
    // Improvement #22: Rich error reporting with file/line/cause
    const errorDetails = {
      requestId,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      type: err.name || 'EnhancementError',
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    // Try to extract file/line from error
    if (err.stack) {
      const stackMatch = err.stack.match(/at\s+.*?\((.*?):(\d+):(\d+)\)/);
      if (stackMatch) {
        errorDetails.file = stackMatch[1];
        errorDetails.line = parseInt(stackMatch[2]);
        errorDetails.column = parseInt(stackMatch[3]);
      }
    }
    
    await writeLog('ERROR', 'Enhancement failed', errorDetails);
    
    res.status(500).json({
      success: false,
      error: 'Enhancement failed',
      requestId,
      ...errorDetails
    });
  }
}

async function getEnhancementStatus(req, res) {
  try {
    const { getEnhancementStatusFunction } = await loadEnhancerModule();
    await getEnhancementStatusFunction(req, res);
  } catch (err) {
    await writeLog('ERROR', 'Status check failed', { error: err.message });
    res.status(500).json({ 
      success: false,
      error: err.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Improvement #28: Diff preview endpoint (optional)
async function previewChanges(req, res) {
  try {
    const rawScriptPath = req.body.file;
    if (!rawScriptPath) {
      return res.status(400).json({ error: 'File path required' });
    }
    
    const { enhanceScriptFunction } = await loadEnhancerModule();
    
    // Run in dry-run mode to get what would be generated
    const result = await enhanceScriptFunction(rawScriptPath, { dryRun: true, incremental: true });
    
    // Compare with existing files
    const changes = [];
    // TODO: Implement diff logic
    
    res.json({
      success: true,
      changes,
      preview: result.details
    });
  } catch (err) {
    await writeLog('ERROR', 'Preview failed', { error: err.message });
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  enhanceScript,
  getEnhancementStatus,
  previewChanges
};
