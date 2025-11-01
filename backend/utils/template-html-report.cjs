// HTML Report Template Generator
// Generates a comprehensive HTML dashboard for test analytics

function generateEnhancedHTMLReport(analytics) {
    const {
        summary = {},
        performanceMetrics = {},
        coverage = {},
        insights = [],
        testDetails = [],
        stepAnalytics = []
    } = analytics;

    const passed = summary.passed || 0;
    const failed = summary.failed || 0;
    const skipped = summary.skipped || 0;
    const total = summary.totalTests || 0;
    const duration = summary.duration || 0;
    const durationSeconds = (duration / 1000).toFixed(2);

    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    const pagesCovered = Array.isArray(coverage.pagesCovered) ? coverage.pagesCovered : [];
    const actionsPerformed = Array.isArray(coverage.actionsPerformed) ? coverage.actionsPerformed : [];

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scriptify AI - Test Analytics Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
        }
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        .header p {
            opacity: 0.9;
            font-size: 1.1em;
        }
        .content {
            padding: 30px;
        }
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        .metric-card {
            background: #f8f9fa;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border-left: 4px solid #667eea;
        }
        .metric-card h3 {
            color: #667eea;
            margin-bottom: 10px;
            font-size: 0.9em;
            text-transform: uppercase;
        }
        .metric-card .value {
            font-size: 2.5em;
            font-weight: bold;
            color: #333;
        }
        .metric-card.success { border-left-color: #28a745; }
        .metric-card.success .value { color: #28a745; }
        .metric-card.failed { border-left-color: #dc3545; }
        .metric-card.failed .value { color: #dc3545; }
        .section {
            margin-bottom: 40px;
        }
        .section h2 {
            color: #667eea;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid #e9ecef;
        }
        .test-list {
            display: grid;
            gap: 15px;
        }
        .test-item {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .test-item.passed { border-left-color: #28a745; }
        .test-item.failed { border-left-color: #dc3545; }
        .test-item.skipped { border-left-color: #ffc107; }
        .test-name {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .test-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.85em;
            margin-right: 10px;
        }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .status-skipped { background: #fff3cd; color: #856404; }
        .insights-list {
            list-style: none;
            padding: 0;
        }
        .insight-item {
            background: #e7f3ff;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 6px;
            border-left: 4px solid #667eea;
        }
        .insight-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #667eea;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        th, td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #dee2e6;
        }
        th {
            background: #667eea;
            color: white;
            font-weight: 600;
        }
        tr:hover {
            background: #f8f9fa;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #6c757d;
            background: #f8f9fa;
            margin-top: 40px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Scriptify AI - Test Analytics Dashboard</h1>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        <div class="content">
            <div class="metrics-grid">
                <div class="metric-card">
                    <h3>Total Tests</h3>
                    <div class="value">${total}</div>
                </div>
                <div class="metric-card success">
                    <h3>Passed</h3>
                    <div class="value">${passed}</div>
                </div>
                <div class="metric-card failed">
                    <h3>Failed</h3>
                    <div class="value">${failed}</div>
                </div>
                <div class="metric-card">
                    <h3>Success Rate</h3>
                    <div class="value">${successRate}%</div>
                </div>
                <div class="metric-card">
                    <h3>Duration</h3>
                    <div class="value">${durationSeconds}s</div>
                </div>
            </div>

            ${testDetails.length > 0 ? `
            <div class="section">
                <h2>📋 Test Details</h2>
                <div class="test-list">
                    ${testDetails.map(test => `
                        <div class="test-item ${test.status || 'unknown'}">
                            <div class="test-name">${test.name || 'Unknown Test'}</div>
                            <span class="test-status status-${test.status || 'unknown'}">${(test.status || 'unknown').toUpperCase()}</span>
                            <span>Duration: ${(test.duration || 0) / 1000}s</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${performanceMetrics.totalExecutionTime ? `
            <div class="section">
                <h2>⚡ Performance Metrics</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>Total Execution Time</h3>
                        <div class="value">${(performanceMetrics.totalExecutionTime / 1000).toFixed(2)}s</div>
                    </div>
                    <div class="metric-card">
                        <h3>Average Step Duration</h3>
                        <div class="value">${(performanceMetrics.averageStepDuration || 0).toFixed(0)}ms</div>
                    </div>
                    <div class="metric-card">
                        <h3>Total Steps</h3>
                        <div class="value">${performanceMetrics.stepCount || 0}</div>
                    </div>
                </div>
            </div>
            ` : ''}

            ${pagesCovered.length > 0 || actionsPerformed.length > 0 ? `
            <div class="section">
                <h2>🎯 Coverage Analysis</h2>
                ${pagesCovered.length > 0 ? `
                    <h3>Pages Covered (${pagesCovered.length})</h3>
                    <p>${pagesCovered.join(', ')}</p>
                ` : ''}
                ${actionsPerformed.length > 0 ? `
                    <h3>Actions Performed (${actionsPerformed.length})</h3>
                    <p>${actionsPerformed.join(', ')}</p>
                ` : ''}
            </div>
            ` : ''}

            ${insights.length > 0 ? `
            <div class="section">
                <h2>💡 Insights</h2>
                <ul class="insights-list">
                    ${insights.map(insight => `
                        <li class="insight-item">
                            <div class="insight-title">${insight.title || 'Insight'}</div>
                            <div>${insight.message || ''}</div>
                        </li>
                    `).join('')}
                </ul>
            </div>
            ` : ''}

            ${stepAnalytics.length > 0 ? `
            <div class="section">
                <h2>🔍 Step Analytics</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Step Name</th>
                            <th>Status</th>
                            <th>Duration</th>
                            <th>Page</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${stepAnalytics.slice(0, 50).map(step => `
                            <tr>
                                <td>${step.stepName || step.name || 'Unknown'}</td>
                                <td><span class="test-status status-${step.status || 'unknown'}">${(step.status || 'unknown').toUpperCase()}</span></td>
                                <td>${((step.duration || 0) / 1000).toFixed(2)}s</td>
                                <td>${step.page || 'N/A'}</td>
                                <td>${step.action || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
        </div>
        <div class="footer">
            <p>Generated by Scriptify AI | ${new Date().toLocaleString()}</p>
        </div>
    </div>
</body>
</html>`;
}

module.exports = {
    generateEnhancedHTMLReport
};

