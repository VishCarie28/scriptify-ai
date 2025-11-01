const path = require('path');

// File paths
const PATHS = {
  RECORDINGS: path.resolve(__dirname, '../../test-cases/raw'),
  DATA: path.resolve(__dirname, '../../test-cases/data'),
  PAGES: path.resolve(__dirname, '../../test-cases/pages'),
  TESTS: path.resolve(__dirname, '../../test-cases/tests'),
  UTILS: path.resolve(__dirname, '../../test-cases/utils'),
  TEST_CASES: path.resolve(__dirname, '../../test-cases'), // Root of test-cases directory
  ROOT: path.resolve(__dirname, '../..'), // Project root directory
  REPORTS: path.resolve(__dirname, '../../test-results/reports'),
  SCREENSHOTS: path.resolve(__dirname, '../../test-results/screenshots'),
  VIDEOS: path.resolve(__dirname, '../../test-results/videos')
};

// File names
const FILE_NAMES = {
  RAW_SCRIPT: 'raw_script.py',
  DEFAULT_CSV: 'test_users.csv'
};

// API endpoints
const API_ENDPOINTS = {
  HEALTH: '/health',
  RECORDER: {
    START: '/api/recorder/start',
    STOP: '/api/recorder/stop',
    STATUS: '/api/recorder/status'
  },
  ENHANCER: {
    ENHANCE: '/api/enhancer/enhance',
    STATUS: '/api/enhancer/status'
  },
  TESTS: {
    RUN: '/api/tests/run',
    STATUS: '/api/tests/status'
  },
  JENKINS: {
    TRIGGER: '/api/jenkins/trigger',
    STATUS: '/api/jenkins/status'
  },
  ANALYTICS: {
    GENERATE: '/api/analytics/generate',
    OPEN: '/api/analytics/open',
    STATUS: '/api/analytics/status'
  }
};

// Default configuration
const DEFAULT_CONFIG = {
  browser: 'chromium',
  headless: false,
  slowMo: 1000,
  timeout: 30000,
  RECORDING: {
    TIMEOUT: 300000 // 5 minutes
  }
};

module.exports = {
  PATHS,
  FILE_NAMES,
  API_ENDPOINTS,
  DEFAULT_CONFIG
};