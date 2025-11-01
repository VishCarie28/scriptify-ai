const fs = require('fs').promises;
const path = require('path');

// Import utilities
const logger = require('../utils/logger.cjs');
const ErrorHandler = require('../utils/error-handler.cjs');
const TestAnalytics = require('../utils/test-analytics.cjs');
const TestResultsParser = require('../utils/test-results-parser.cjs');
const { ConsoleHelper, MODULES } = require('../utils/console-helper.cjs');

class AnalyticsController {
    constructor() {
        this.analytics = new TestAnalytics();
        this.parser = new TestResultsParser();
        this.reportsDir = path.join(__dirname, '../../test-results/reports');
        this.analyticsDir = path.join(__dirname, '../../test-results/analytics');
        // Ensure directories exist on initialization
        this.ensureDirectories();
    }

    async ensureDirectories() {
        try {
            await fs.mkdir(this.reportsDir, { recursive: true });
            await fs.mkdir(this.analyticsDir, { recursive: true });
        } catch (error) {
            ConsoleHelper.warning(MODULES.ANALYTICS, `Could not ensure directories: ${error.message}`);
        }
    }

    async generateAnalyticsReport(req, res) {
        try {
            ConsoleHelper.log(MODULES.ANALYTICS, 'Generate analytics requested');
            logger.info('Generating comprehensive analytics report');

            // Ensure directories exist before proceeding
            await this.ensureDirectories();

            // Parse test results
            ConsoleHelper.log(MODULES.ANALYTICS, 'Parsing test results...');
            logger.info('Starting test results parsing for analytics');
            
            let metrics, testResults;
            try {
                const result = await this.parser.getTestExecutionMetrics();
                metrics = result.metrics || {};
                testResults = result.testResults || [];
                
                ConsoleHelper.log(MODULES.ANALYTICS, `Parsing complete. Found ${testResults.length} test result(s)`);
                logger.info('Test results parsed', { count: testResults.length });
            } catch (parseError) {
                ConsoleHelper.error(MODULES.ANALYTICS, `Failed to parse test results: ${parseError.message}`);
                logger.error('Failed to parse test results', { error: parseError.message, stack: parseError.stack });
                
                return res.status(500).json({
                    success: false,
                    error: "Failed to parse test results",
                    message: `Error parsing test results: ${parseError.message}. Please ensure tests have been run and check server logs for details.`,
                    details: parseError.message
                });
            }
            
            if (testResults.length === 0) {
                ConsoleHelper.error(MODULES.ANALYTICS, 'No test results found');
                logger.warn('No test results found for analytics generation');
                
                // Check if reports directory exists
                let reportPath = path.join(this.reportsDir, 'pytest-report.html');
                let reportExists = false;
                try {
                    await fs.access(reportPath);
                    reportExists = true;
                } catch {
                    // Check alternative locations
                    const alternativePaths = [
                        path.join(__dirname, '../../test-results/reports/pytest-report.html'),
                        path.join(process.cwd(), 'test-results/reports/pytest-report.html')
                    ];
                    for (const altPath of alternativePaths) {
                        try {
                            await fs.access(altPath);
                            reportPath = altPath;
                            reportExists = true;
                            break;
                        } catch {
                            // Continue
                        }
                    }
                }
                
                const errorMessage = reportExists 
                    ? "HTML report found but could not be parsed. The report may be corrupted or in an unexpected format. Please ensure tests have completed successfully and pytest-html plugin is properly installed."
                    : `No HTML report found. Please run tests first to generate analytics. Expected report at: ${reportPath}`;
                
                return res.status(404).json({
                    success: false,
                    error: "No test results found",
                    message: errorMessage,
                    reportPath: reportPath,
                    reportExists: reportExists,
                    hint: "Run tests first using the 'Run Tests' step to generate the HTML report. Ensure pytest-html plugin is installed (pip install pytest-html)."
                });
            }

            ConsoleHelper.log(MODULES.ANALYTICS, `Found ${testResults.length} test result(s)`);

            // Generate analytics
            ConsoleHelper.log(MODULES.ANALYTICS, 'Generating analytics...');
            const analyticsData = await this.analytics.generateAnalytics(testResults);
            
            // Generate HTML report
            ConsoleHelper.log(MODULES.ANALYTICS, 'Generating HTML report...');
            const htmlReport = await this.analytics.generateHTMLReport(analyticsData);
            
            // Save HTML report
            const reportPath = path.join(this.reportsDir, 'analytics-dashboard.html');
            await fs.writeFile(reportPath, htmlReport);
            
            ConsoleHelper.success(MODULES.ANALYTICS, `Analytics report generated (${testResults.length} tests)`);
            
            logger.success('Analytics report generated successfully', { 
                reportPath,
                testCount: testResults.length 
            });

            // Generate comprehensive report (optimized - no async needed)
            const comprehensiveReport = this.analytics.generateComprehensiveReport(analyticsData);
            
            res.json({
                success: true,
                message: "Analytics report generated successfully",
                data: {
                    reportPath: '/panel/analytics-dashboard.html',
                    analytics: comprehensiveReport,
                    metrics: metrics,
                    testCount: testResults.length,
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            ConsoleHelper.error(MODULES.ANALYTICS, `Analytics generation failed: ${error.message}`);
            logger.error('Analytics report generation failed', error);
            ErrorHandler.handleError(error, req, res);
        }
    }

    async getAnalyticsData(req, res) {
        try {
            logger.info('Fetching analytics data');

            const { metrics, testResults } = await this.parser.getTestExecutionMetrics();
            
            res.json({
                success: true,
                data: {
                    metrics,
                    testResults,
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Failed to fetch analytics data', error);
            ErrorHandler.handleError(error, req, res);
        }
    }

    async openAnalyticsReport(req, res) {
        try {
            ConsoleHelper.log(MODULES.ANALYTICS, 'Open analytics report requested');
            const reportPath = path.join(this.reportsDir, 'analytics-dashboard.html');
            
            // Check if report exists
            try {
                await fs.access(reportPath);
            } catch {
                ConsoleHelper.error(MODULES.ANALYTICS, 'Report not found');
                return res.status(404).json({
                    error: "Analytics report not found",
                    message: "Please generate the analytics report first"
                });
            }

            // Open report in browser
            const { exec } = require('child_process');
            const openCommand = process.platform === 'darwin' ? 'open' : 
                               process.platform === 'win32' ? 'start' : 'xdg-open';
            
            exec(`${openCommand} "${reportPath}"`, (error) => {
                if (error) {
                    ConsoleHelper.error(MODULES.ANALYTICS, `Could not open report: ${error.message}`);
                    logger.error('Failed to open analytics report', error);
                } else {
                    ConsoleHelper.success(MODULES.ANALYTICS, 'Report opened in browser');
                    logger.info('Analytics report opened in browser');
                }
            });

            res.json({
                reportPath: "/panel/analytics-dashboard.html",
                status: "opened",
                message: "Analytics report opened in browser"
            });

        } catch (error) {
            ConsoleHelper.error(MODULES.ANALYTICS, `Open report failed: ${error.message}`);
            logger.error('Failed to open analytics report', error);
            ErrorHandler.handleError(error, req, res);
        }
    }

    async getTestInsights(req, res) {
        try {
            const { metrics, testResults } = await this.parser.getTestExecutionMetrics();
            
            const insights = [];
            
            // Performance insights
            if (metrics.averageDuration > 0) {
                insights.push({
                    type: 'performance',
                    title: 'Test Performance',
                    message: `Average test duration: ${(metrics.averageDuration / 1000).toFixed(2)}s`,
                    priority: 'medium'
                });
            }

            // Coverage insights
            if (metrics.pageCoverage.length > 0) {
                insights.push({
                    type: 'coverage',
                    title: 'Page Coverage',
                    message: `Covered ${metrics.pageCoverage.length} pages: ${metrics.pageCoverage.join(', ')}`,
                    priority: 'low'
                });
            }

            // Success rate insights
            const successRate = (metrics.passed / metrics.totalTests) * 100;
            if (successRate === 100) {
                insights.push({
                    type: 'success',
                    title: 'Perfect Success Rate',
                    message: 'All tests passed successfully!',
                    priority: 'high'
                });
            } else if (successRate < 80) {
                insights.push({
                    type: 'warning',
                    title: 'Low Success Rate',
                    message: `Only ${successRate.toFixed(1)}% of tests passed`,
                    priority: 'high'
                });
            }

            // Step count insights
            if (metrics.stepCount > 0) {
                insights.push({
                    type: 'steps',
                    title: 'Test Steps',
                    message: `Total steps executed: ${metrics.stepCount}`,
                    priority: 'low'
                });
            }

            res.json({
                success: true,
                data: {
                    insights,
                    metrics,
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Failed to get test insights', error);
            ErrorHandler.handleError(error, req, res);
        }
    }

    async getPerformanceMetrics(req, res) {
        try {
            const { metrics, testResults } = await this.parser.getTestExecutionMetrics();
            
            const performanceMetrics = {
                totalExecutionTime: metrics.totalDuration,
                averageTestDuration: metrics.averageDuration,
                totalSteps: metrics.stepCount,
                averageStepsPerTest: metrics.stepCount / metrics.totalTests,
                pageCoverage: metrics.pageCoverage.length,
                actionCoverage: metrics.actionCoverage.length,
                testSuites: metrics.testSuites.length
            };

            res.json({
                success: true,
                data: {
                    performance: performanceMetrics,
                    generatedAt: new Date().toISOString()
                }
            });

        } catch (error) {
            logger.error('Failed to get performance metrics', error);
            ErrorHandler.handleError(error, req, res);
        }
    }
}

// Create controller instance and bind methods
const analyticsController = new AnalyticsController();

module.exports = {
    generateAnalyticsReport: ErrorHandler.asyncHandler(analyticsController.generateAnalyticsReport.bind(analyticsController)),
    getAnalyticsData: ErrorHandler.asyncHandler(analyticsController.getAnalyticsData.bind(analyticsController)),
    openAnalyticsReport: ErrorHandler.asyncHandler(analyticsController.openAnalyticsReport.bind(analyticsController)),
    getTestInsights: ErrorHandler.asyncHandler(analyticsController.getTestInsights.bind(analyticsController)),
    getPerformanceMetrics: ErrorHandler.asyncHandler(analyticsController.getPerformanceMetrics.bind(analyticsController))
};
