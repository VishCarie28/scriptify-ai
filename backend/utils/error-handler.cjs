// backend/utils/error-handler.cjs
const logger = require('./logger.cjs');
const { isDevelopment } = require('../config/environment.cjs');

// Simple ValidationError class (previously in validation.js)
class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

class ErrorHandler {
  static handleError(error, req, res, next) {
    // Check if response has already been sent - if so, just log and return
    if (res.headersSent) {
      console.error('❌ [ERROR HANDLER] Response already sent, cannot send error response');
      console.error('❌ [ERROR HANDLER] Error was:', error?.message || error);
      return;
    }
    
    // Handle case where error might be null, undefined, or not an Error object
    if (!error) {
      error = new Error('Unknown error occurred - error object was null or undefined');
    }
    
    if (!(error instanceof Error)) {
      error = new Error(String(error));
    }
    
    const errorMessage = error.message || 'An unexpected error occurred';
    const errorStack = error.stack || 'No stack trace available';
    const errorName = error.name || 'Error';
    const errorCode = error.code || undefined;
    
    console.error('❌ [ERROR HANDLER] ============================================');
    console.error('❌ [ERROR HANDLER] Error message:', errorMessage);
    console.error('❌ [ERROR HANDLER] Error name:', errorName);
    console.error('❌ [ERROR HANDLER] Error code:', errorCode);
    console.error('❌ [ERROR HANDLER] Stack:', errorStack);
    try {
      console.error('❌ [ERROR HANDLER] Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    } catch (e) {
      console.error('❌ [ERROR HANDLER] Could not stringify error:', e);
    }
    console.error('❌ [ERROR HANDLER] ============================================');
    
    try {
      logger.error('Request error', error, {
        method: req?.method,
        url: req?.url,
        body: req?.body
      });
    } catch (logErr) {
      console.error('❌ [ERROR HANDLER] Failed to log error:', logErr);
    }

    if (error instanceof ValidationError) {
      console.log('❌ [ERROR HANDLER] Validation error detected');
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        field: error.field
      });
    }

    if (error?.code === 'ENOENT') {
      return res.status(404).json({
        error: 'File Not Found',
        message: 'The requested file could not be found'
      });
    }

    if (error?.code === 'EACCES') {
      return res.status(403).json({
        error: 'Permission Denied',
        message: 'Insufficient permissions to access the resource'
      });
    }

    if (error?.code === 'ETIMEDOUT' || error?.name === 'AbortError') {
      return res.status(408).json({
        error: 'Request Timeout',
        message: 'The request timed out'
      });
    }

    // Default error response - always show details in development
    const statusCode = error?.statusCode || 500;
    const response = {
      error: 'Internal Server Error',
      message: errorMessage,
      stack: errorStack
    };

    // In development, include more details
    if (isDevelopment) {
      response.details = {
        name: errorName,
        code: errorCode,
        fullError: error?.toString() || String(error)
      };
    }

    res.status(statusCode).json(response);
  }

  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  static notFound(req, res) {
    res.status(404).json({
      error: 'Not Found',
      message: `Route ${req.method} ${req.url} not found`
    });
  }
}

module.exports = ErrorHandler;
