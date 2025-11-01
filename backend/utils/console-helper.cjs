// backend/utils/console-helper.js
/**
 * Simple console message helper for consistent logging
 * Format: [MODULE] Message
 */

const MODULES = {
  RECORDER: '🎥',
  ENHANCER: '✨',
  TESTS: '🧪',
  ANALYTICS: '📈',
  JENKINS: '🚀',
  SERVER: '🚀',
  STOP: '🛑'
};

class ConsoleHelper {
  static log(module, message) {
    console.log(`[${module}] ${message}`);
  }

  static success(module, message) {
    console.log(`[${module}] ✅ ${message}`);
  }

  static error(module, message) {
    console.log(`[${module}] ❌ ${message}`);
  }

  static warning(module, message) {
    console.log(`[${module}] ⚠️  ${message}`);
  }

  static info(module, message) {
    console.log(`[${module}] ℹ️  ${message}`);
  }
}

module.exports = { ConsoleHelper, MODULES };
