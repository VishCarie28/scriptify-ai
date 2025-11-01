// backend/utils/logger.js
const { isDevelopment } = require('../config/environment.cjs');

class Logger {
  constructor() {
    // Ensure isDevelopment is always defined
    this.isDev = isDevelopment !== undefined ? isDevelopment : true;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  info(message, meta = {}) {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? { 
      ...meta, 
      error: error.message, 
      stack: this.isDev ? error.stack : undefined 
    } : meta;
    console.error(this.formatMessage('error', message, errorMeta));
  }

  debug(message, meta = {}) {
    if (this.isDev) {
      console.debug(this.formatMessage('debug', message, meta));
    }
  }

  success(message, meta = {}) {
    console.log(`✓ ${this.formatMessage('success', message, meta)}`);
  }
}

module.exports = new Logger();
