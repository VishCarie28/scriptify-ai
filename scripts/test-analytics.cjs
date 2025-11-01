#!/usr/bin/env node
/**
 * Test script for analytics generation and report opening
 * Usage: node scripts/test-analytics.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:4000';
const TIMEOUT = 300000; // 5 minutes

function makeRequest(options, data = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let responseData = '';

            res.on('data', (chunk) => {
                responseData += chunk;
            });

            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: responseData });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(TIMEOUT, () => {
            req.destroy();
            reject(new Error(`Request timed out after ${TIMEOUT}ms`));
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testHealthCheck() {
    console.log('\n🏥 Testing server health...');
    try {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/health',
            method: 'GET'
        };

        const response = await makeRequest(options);
        if (response.status === 200) {
            console.log('✅ Server is running');
            console.log('   Response:', response.data);
            return true;
        } else {
            console.log('❌ Server returned status:', response.status);
            return false;
        }
    } catch (error) {
        console.log('❌ Server is not responding:', error.message);
        console.log('   Make sure the server is running: npm start');
        return false;
    }
}

async function testGenerateAnalytics() {
    console.log('\n📈 Testing analytics generation...');
    try {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/api/analytics/generate',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        console.log('   Sending request to:', `${BASE_URL}${options.path}`);
        console.log('   Timeout set to:', TIMEOUT / 1000, 'seconds');
        console.log('   Please wait, this may take a while...');

        const startTime = Date.now();
        const response = await makeRequest(options, {});
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        if (response.status === 200) {
            console.log(`✅ Analytics generated successfully in ${duration}s`);
            console.log('   Response:', JSON.stringify(response.data, null, 2));
            
            if (response.data.data && response.data.data.reportPath) {
                console.log('\n   Report path:', response.data.data.reportPath);
                console.log('   Full URL:', `${BASE_URL}${response.data.data.reportPath}`);
            }
            
            return true;
        } else if (response.status === 404) {
            console.log('⚠️  No test results found');
            console.log('   Message:', response.data.message || response.data.error);
            console.log('   Please run tests first to generate analytics');
            return false;
        } else {
            console.log('❌ Analytics generation failed');
            console.log('   Status:', response.status);
            console.log('   Response:', JSON.stringify(response.data, null, 2));
            return false;
        }
    } catch (error) {
        console.log('❌ Analytics generation error:', error.message);
        if (error.message.includes('timeout')) {
            console.log('   The request timed out. This might indicate:');
            console.log('   - Large test result files taking too long to parse');
            console.log('   - Server performance issues');
            console.log('   - Network connectivity problems');
        }
        return false;
    }
}

async function testOpenAnalytics() {
    console.log('\n📊 Testing analytics report opening...');
    try {
        const options = {
            hostname: 'localhost',
            port: 4000,
            path: '/api/analytics/open',
            method: 'GET'
        };

        const response = await makeRequest(options);

        if (response.status === 200) {
            console.log('✅ Report opened successfully');
            console.log('   Response:', JSON.stringify(response.data, null, 2));
            
            if (response.data.reportPath) {
                console.log('\n   Report should be opened in your default browser');
                console.log('   Report path:', `${BASE_URL}${response.data.reportPath}`);
            }
            
            return true;
        } else if (response.status === 404) {
            console.log('⚠️  Analytics report not found');
            console.log('   Message:', response.data.message || response.data.error);
            console.log('   Please generate analytics first');
            return false;
        } else {
            console.log('❌ Failed to open report');
            console.log('   Status:', response.status);
            console.log('   Response:', JSON.stringify(response.data, null, 2));
            return false;
        }
    } catch (error) {
        console.log('❌ Error opening report:', error.message);
        return false;
    }
}

async function runTests() {
    console.log('🧪 Scriptify AI - Analytics Test Script');
    console.log('=====================================');

    // Test 1: Health check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('\n❌ Server is not available. Exiting.');
        process.exit(1);
    }

    // Test 2: Generate analytics
    const generateOk = await testGenerateAnalytics();
    
    if (!generateOk) {
        console.log('\n⚠️  Analytics generation failed or no test results found.');
        console.log('   This is expected if you haven\'t run tests yet.');
        process.exit(0);
    }

    // Test 3: Open analytics (only if generation succeeded)
    await testOpenAnalytics();

    console.log('\n✅ All tests completed!');
}

// Run the tests
runTests().catch((error) => {
    console.error('\n❌ Test script error:', error);
    process.exit(1);
});

