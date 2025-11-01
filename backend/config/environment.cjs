// Environment configuration
require('dotenv').config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isDevelopment = nodeEnv === 'development';

module.exports = {
  NODE_ENV: nodeEnv,
  isDevelopment,
  PORT: process.env.PORT || 4000,
  HOST: process.env.HOST || 'localhost',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  
  server: {
    port: process.env.PORT || 4000,
    host: process.env.HOST || 'localhost',
    nodeEnv
  },
  
  // OpenAI AI configuration
  USE_AI_ENHANCEMENT: process.env.USE_AI_ENHANCEMENT === 'true',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_API_URL: process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions',
  OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
  OPENAI_TEMPERATURE: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1'),
  FALLBACK_TO_LOCAL_AI: process.env.FALLBACK_TO_LOCAL_AI !== 'false',
  
  // Test configuration
  BASE_URL: process.env.BASE_URL || 'https://codeaurorix.preview.sqrxenterprise.com/',
  BROWSER_TYPE: process.env.BROWSER_TYPE || 'chromium',
  HEADLESS: process.env.HEADLESS === 'true',
  SLOW_MO: parseInt(process.env.SLOW_MO || '1000'),
  TIMEOUT: parseInt(process.env.TIMEOUT || '30000'),
  
  // Directory configuration
  RECORDINGS_DIR: process.env.RECORDINGS_DIR || 'test-cases/recordings',
  SCREENSHOTS_DIR: process.env.SCREENSHOTS_DIR || 'test-results/screenshots',
  VIDEOS_DIR: process.env.VIDEOS_DIR || 'test-results/videos',
  REPORTS_DIR: process.env.REPORTS_DIR || 'test-results/reports',
  
  // Jenkins configuration
  jenkins: {
    url: process.env.JENKINS_URL || '',
    jobName: process.env.JENKINS_JOB_NAME || 'scriptify-ai-tests',
    user: process.env.JENKINS_USER || '',
    token: process.env.JENKINS_API_TOKEN || ''
  }
};
