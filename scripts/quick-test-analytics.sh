#!/bin/bash
# Quick test script for analytics - checks if server is running and tests endpoints

echo "🧪 Scriptify AI - Quick Analytics Test"
echo "======================================="
echo ""

# Check if server is running
if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
    echo "❌ Server is not running on port 4000"
    echo ""
    echo "Please start the server first:"
    echo "   npm start"
    echo "   or"
    echo "   npm run start:all"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
HEALTH=$(curl -s http://localhost:4000/health)
if [ $? -eq 0 ]; then
    echo "✅ Health check passed"
    echo "   Response: $HEALTH"
else
    echo "❌ Health check failed"
    exit 1
fi

echo ""
echo "📈 Testing analytics generation..."
echo "   This may take up to 5 minutes..."
echo ""

# Test analytics generation with timeout
ANALYTICS_RESPONSE=$(timeout 300 curl -s -X POST http://localhost:4000/api/analytics/generate \
    -H "Content-Type: application/json" \
    -d '{}' 2>&1)

EXIT_CODE=$?

if [ $EXIT_CODE -eq 124 ]; then
    echo "❌ Request timed out after 5 minutes"
    echo "   This indicates the analytics generation is taking too long"
    echo "   Check server logs for details"
    exit 1
elif [ $EXIT_CODE -ne 0 ]; then
    echo "❌ Request failed with error code: $EXIT_CODE"
    echo "   Response: $ANALYTICS_RESPONSE"
    exit 1
fi

# Check if response indicates success
if echo "$ANALYTICS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Analytics generated successfully!"
    echo ""
    echo "📊 Opening analytics report..."
    
    # Try to open the report
    OPEN_RESPONSE=$(curl -s http://localhost:4000/api/analytics/open)
    if echo "$OPEN_RESPONSE" | grep -q '"status":"opened"'; then
        echo "✅ Report opened in browser"
    else
        echo "⚠️  Report may not have opened automatically"
        echo "   You can open it manually at: http://localhost:4000/panel/analytics-dashboard.html"
    fi
    
    echo ""
    echo "✅ All tests passed!"
else
    echo "❌ Analytics generation failed or no test results found"
    echo "   Response: $ANALYTICS_RESPONSE"
    echo ""
    echo "   This is expected if:"
    echo "   - Tests haven't been run yet"
    echo "   - Test results are missing"
    echo ""
    echo "   Try running tests first: npm test"
    exit 1
fi

