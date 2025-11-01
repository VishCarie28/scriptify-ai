const fs = require('fs').promises;
const path = require('path');

class TestAnalytics {
    constructor() {
        this.resultsDir = path.join(__dirname, '../../test-results');
        this.reportsDir = path.join(__dirname, '../../test-results/reports');
        this.analyticsDir = path.join(__dirname, '../../test-results/analytics');
    }

    async generateAnalytics(testResults) {
        try {
            // Ensure directories exist
            await this.ensureDirectories();
            
            // Parse test results
            const analytics = await this.parseTestResults(testResults);
            
            // Generate comprehensive report
            const report = await this.generateComprehensiveReport(analytics);
            
            // Save analytics data
            await this.saveAnalyticsData(analytics);
            
            // Return analytics object (not report) for HTML generation
            return analytics;
        } catch (error) {
            console.error('Error generating analytics:', error);
            throw error;
        }
    }

    async ensureDirectories() {
        const dirs = [this.resultsDir, this.reportsDir, this.analyticsDir];
        for (const dir of dirs) {
            await fs.mkdir(dir, { recursive: true });
        }
    }

    async parseTestResults(testResults) {
        const analytics = {
            summary: {
                totalTests: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
                duration: 0,
                timestamp: new Date().toISOString()
            },
            testDetails: [],
            stepAnalytics: [],
            performanceMetrics: {
                averageStepDuration: 0,
                slowestStep: null,
                fastestStep: null,
                totalExecutionTime: 0
            },
            coverage: {
                pagesCovered: new Set(),
                actionsPerformed: new Set(),
                userFlows: []
            },
            insights: []
        };

        // Process each test result
        for (const result of testResults) {
            analytics.summary.totalTests++;
            analytics.summary.duration += result.duration || 0;
            
            if (result.status === 'passed') {
                analytics.summary.passed++;
            } else if (result.status === 'failed') {
                analytics.summary.failed++;
            } else {
                analytics.summary.skipped++;
            }

            // Process test details
            const testDetail = {
                name: result.name,
                status: result.status,
                duration: result.duration,
                steps: result.steps || [],
                timestamp: result.timestamp,
                browser: result.browser || 'chromium',
                headless: result.headless || false
            };

            analytics.testDetails.push(testDetail);

            // Process steps
            if (result.steps) {
                for (const step of result.steps) {
                    const stepAnalytic = {
                        testName: result.name,
                        stepName: step.name,
                        status: step.status,
                        duration: step.duration,
                        timestamp: step.timestamp,
                        page: this.extractPageFromStep(step.name),
                        action: this.extractActionFromStep(step.name)
                    };

                    analytics.stepAnalytics.push(stepAnalytic);
                    analytics.coverage.actionsPerformed.add(stepAnalytic.action);
                }
            }

            // Track page coverage
            if (result.pages) {
                result.pages.forEach(page => analytics.coverage.pagesCovered.add(page));
            }
        }

        // Calculate performance metrics (pass testDetails for fallback)
        analytics.performanceMetrics = this.calculatePerformanceMetrics(analytics.stepAnalytics, analytics.testDetails);
        
        // Generate insights
        analytics.insights = this.generateInsights(analytics);

        return analytics;
    }

    extractPageFromStep(stepName) {
        const pageKeywords = ['login', 'inventory', 'cart', 'checkout', 'complete'];
        for (const keyword of pageKeywords) {
            if (stepName.toLowerCase().includes(keyword)) {
                return keyword;
            }
        }
        return 'unknown';
    }

    extractActionFromStep(stepName) {
        const actionKeywords = ['navigate', 'login', 'add', 'click', 'fill', 'verify', 'complete'];
        for (const keyword of actionKeywords) {
            if (stepName.toLowerCase().includes(keyword)) {
                return keyword;
            }
        }
        return 'unknown';
    }

    calculatePerformanceMetrics(stepAnalytics, testDetails) {
        // Use step analytics if available, otherwise fall back to test durations
        let durations = stepAnalytics.map(step => step.duration || 0).filter(d => d > 0);
        
        // If no step durations, use test durations as fallback
        if (durations.length === 0 && testDetails && testDetails.length > 0) {
            durations = testDetails.map(test => test.duration || 0).filter(d => d > 0);
            // Use test durations as step durations for calculation
            stepAnalytics = testDetails.map(test => ({
                stepName: test.name,
                duration: test.duration || 0,
                status: test.status
            }));
        }
        
        if (durations.length === 0) {
            return {
                averageStepDuration: 0,
                slowestStep: null,
                fastestStep: null,
                totalExecutionTime: 0,
                stepCount: 0
            };
        }

        const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
        const avgDuration = totalDuration / durations.length;
        
        const slowestStep = stepAnalytics.reduce((slowest, current) => 
            ((current.duration || 0) > (slowest?.duration || 0)) ? current : slowest, null);
        
        const fastestStep = stepAnalytics.reduce((fastest, current) => 
            ((current.duration || 0) < (fastest?.duration || Infinity)) ? current : fastest, null);

        return {
            averageStepDuration: avgDuration,
            slowestStep,
            fastestStep,
            totalExecutionTime: totalDuration,
            stepCount: durations.length,
            minDuration: Math.min(...durations),
            maxDuration: Math.max(...durations)
        };
    }

    generateInsights(analytics) {
        const insights = [];

        // Test execution insights
        if (analytics.summary.passed === analytics.summary.totalTests) {
            insights.push({
                type: 'success',
                title: 'Perfect Test Execution',
                message: 'All tests passed successfully!',
                priority: 'high'
            });
        }

        // Performance insights
        if (analytics.performanceMetrics.slowestStep) {
            insights.push({
                type: 'performance',
                title: 'Slowest Step Identified',
                message: `"${analytics.performanceMetrics.slowestStep.stepName}" took ${analytics.performanceMetrics.slowestStep.duration}ms`,
                priority: 'medium'
            });
        }

        // Coverage insights
        if (analytics.coverage.pagesCovered.size > 0) {
            insights.push({
                type: 'coverage',
                title: 'Page Coverage',
                message: `Covered ${analytics.coverage.pagesCovered.size} different pages`,
                priority: 'low'
            });
        }

        // Action insights
        if (analytics.coverage.actionsPerformed.size > 0) {
            insights.push({
                type: 'actions',
                title: 'Action Diversity',
                message: `Performed ${analytics.coverage.actionsPerformed.size} different types of actions`,
                priority: 'low'
            });
        }

        return insights;
    }

    generateComprehensiveReport(analytics) {
        // Convert Sets to Arrays safely
        const pagesCovered = analytics.coverage?.pagesCovered 
            ? (analytics.coverage.pagesCovered instanceof Set 
                ? Array.from(analytics.coverage.pagesCovered)
                : Array.isArray(analytics.coverage.pagesCovered) 
                    ? analytics.coverage.pagesCovered
                    : [])
            : [];
        
        const actionsPerformed = analytics.coverage?.actionsPerformed
            ? (analytics.coverage.actionsPerformed instanceof Set
                ? Array.from(analytics.coverage.actionsPerformed)
                : Array.isArray(analytics.coverage.actionsPerformed)
                    ? analytics.coverage.actionsPerformed
                    : [])
            : [];
        
        const report = {
            title: 'Scriptify AI Test Analytics Report',
            generatedAt: new Date().toISOString(),
            summary: analytics.summary || {},
            performance: analytics.performanceMetrics || {},
            coverage: {
                pagesCovered: pagesCovered,
                actionsPerformed: actionsPerformed,
                totalPages: pagesCovered.length,
                totalActions: actionsPerformed.length
            },
            insights: analytics.insights || [],
            testDetails: analytics.testDetails || [],
            stepAnalytics: analytics.stepAnalytics || []
        };

        return report;
    }

    async saveAnalyticsData(analytics) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `test-analytics-${timestamp}.json`;
        const filepath = path.join(this.analyticsDir, filename);
        
        await fs.writeFile(filepath, JSON.stringify(analytics, null, 2));
        
        // Also save latest
        await fs.writeFile(
            path.join(this.analyticsDir, 'latest-analytics.json'),
            JSON.stringify(analytics, null, 2)
        );
    }

    async generateHTMLReport(analytics) {
        // Safety check for analytics object
        if (!analytics) {
            analytics = {
                summary: { totalTests: 0, passed: 0, failed: 0, skipped: 0, duration: 0 },
                performanceMetrics: { averageStepDuration: 0, totalExecutionTime: 0 },
                coverage: { pagesCovered: [], actionsPerformed: [] },
                insights: [],
                testDetails: []
            };
        }
        
        // Clear module cache to ensure fresh template is loaded
        const templatePath = require.resolve('./template-html-report.cjs');
        delete require.cache[templatePath];
        
        // Use enhanced template
        const { generateEnhancedHTMLReport } = require('./template-html-report.cjs');
        const html = generateEnhancedHTMLReport(analytics);
        
        return html;
    }
}

module.exports = TestAnalytics;
