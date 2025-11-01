const axios = require("axios");

// Import utilities
const logger = require("../utils/logger.cjs");
const ErrorHandler = require("../utils/error-handler.cjs");
const envConfig = require("../config/environment.cjs");
const { ConsoleHelper, MODULES } = require("../utils/console-helper.cjs");

class JenkinsController {
  constructor() {
    this.jenkinsConfig = envConfig.jenkins;
  }

  async triggerPipeline(req, res) {
    try {
      ConsoleHelper.log(MODULES.JENKINS, 'Trigger Jenkins pipeline requested');
      
      // Validate Jenkins configuration
      this.validateJenkinsConfig();

      const triggerUrl = `${this.jenkinsConfig.url}/job/${this.jenkinsConfig.jobName}/build`;
      
      ConsoleHelper.log(MODULES.JENKINS, `Triggering pipeline: ${this.jenkinsConfig.jobName}`);
      logger.info('Triggering Jenkins pipeline', {
        jobName: this.jenkinsConfig.jobName,
        jenkinsUrl: this.jenkinsConfig.url
      });
      
      const response = await axios.post(triggerUrl, null, {
        auth: { 
          username: this.jenkinsConfig.user, 
          password: this.jenkinsConfig.token 
        },
        timeout: 30000, // 30 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      ConsoleHelper.success(MODULES.JENKINS, `Pipeline triggered: ${this.jenkinsConfig.jobName}`);
      
      logger.success('Jenkins pipeline triggered successfully', {
        status: response.status,
        jobName: this.jenkinsConfig.jobName
      });

      res.json({
        message: "Jenkins pipeline triggered successfully",
        status: "triggered",
        jobName: this.jenkinsConfig.jobName,
        jenkinsUrl: this.jenkinsConfig.url,
        metadata: {
          triggeredAt: new Date().toISOString(),
          responseStatus: response.status
        }
      });

    } catch (error) {
      ConsoleHelper.error(MODULES.JENKINS, `Pipeline trigger failed: ${error.message}`);
      logger.error('Failed to trigger Jenkins pipeline', error);
      ErrorHandler.handleError(error, req, res);
    }
  }

  validateJenkinsConfig() {
    const { url, jobName, user, token } = this.jenkinsConfig;
    
    if (!url || !jobName || !user || !token) {
      const missing = [];
      if (!url) missing.push('JENKINS_URL');
      if (!jobName) missing.push('JENKINS_JOB_NAME');
      if (!user) missing.push('JENKINS_USER');
      if (!token) missing.push('JENKINS_API_TOKEN');
      
      throw new Error(`Jenkins configuration missing: ${missing.join(', ')}`);
    }
  }

  async getJenkinsStatus(req, res) {
    try {
      const isConfigured = this.isJenkinsConfigured();
      
      res.json({
        isConfigured,
        status: isConfigured ? 'ready' : 'not_configured',
        message: isConfigured ? 'Jenkins is properly configured' : 'Jenkins configuration is missing'
      });
    } catch (error) {
      ConsoleHelper.error(MODULES.JENKINS, `Get status failed: ${error.message}`);
      logger.error('Failed to get Jenkins status', error);
      ErrorHandler.handleError(error, req, res);
    }
  }

  isJenkinsConfigured() {
    const { url, jobName, user, token } = this.jenkinsConfig;
    return !!(url && jobName && user && token);
  }

  async getJobStatus(req, res) {
    try {
      this.validateJenkinsConfig();

      const jobUrl = `${this.jenkinsConfig.url}/job/${this.jenkinsConfig.jobName}/api/json`;
      
      ConsoleHelper.log(MODULES.JENKINS, `Fetching job status: ${this.jenkinsConfig.jobName}`);
      const response = await axios.get(jobUrl, {
        auth: { 
          username: this.jenkinsConfig.user, 
          password: this.jenkinsConfig.token 
        },
        timeout: 10000
      });

      const jobData = response.data;
      
      res.json({
        jobName: this.jenkinsConfig.jobName,
        status: jobData.color || 'unknown',
        isBuilding: jobData.building || false,
        lastBuild: jobData.lastBuild ? {
          number: jobData.lastBuild.number,
          url: jobData.lastBuild.url
        } : null,
        lastSuccessfulBuild: jobData.lastSuccessfulBuild ? {
          number: jobData.lastSuccessfulBuild.number,
          url: jobData.lastSuccessfulBuild.url
        } : null,
        lastFailedBuild: jobData.lastFailedBuild ? {
          number: jobData.lastFailedBuild.number,
          url: jobData.lastFailedBuild.url
        } : null
      });

    } catch (error) {
      ConsoleHelper.error(MODULES.JENKINS, `Get job status failed: ${error.message}`);
      logger.error('Failed to get Jenkins job status', error);
      ErrorHandler.handleError(error, req, res);
    }
  }
}

const controller = new JenkinsController();

module.exports = {
  triggerPipeline: ErrorHandler.asyncHandler(controller.triggerPipeline.bind(controller)),
  getJenkinsStatus: ErrorHandler.asyncHandler(controller.getJenkinsStatus.bind(controller)),
  getJobStatus: ErrorHandler.asyncHandler(controller.getJobStatus.bind(controller))
};
