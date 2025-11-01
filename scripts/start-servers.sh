#!/bin/bash
# Start Scriptify AI Backend Servers
# This script starts both the main backend server and the bridge server

cd "$(dirname "$0")/.." || exit 1

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Kill any existing servers
lsof -ti :4000 2>/dev/null | xargs kill -9 2>/dev/null
lsof -ti :5454 2>/dev/null | xargs kill -9 2>/dev/null

echo "🚀 Starting Scriptify AI Servers..."
echo ""

# Start main backend server
echo "📡 Starting main backend server on port 4000..."
node backend/server.cjs > /tmp/scriptify-server.log 2>&1 &
MAIN_PID=$!
sleep 2

# Start bridge server
echo "🌉 Starting bridge server on port 5454..."
node backend/cliBridge.js > /tmp/scriptify-bridge.log 2>&1 &
BRIDGE_PID=$!
sleep 2

# Check if servers started successfully
if ps -p $MAIN_PID > /dev/null && ps -p $BRIDGE_PID > /dev/null; then
    # Test endpoints
    if curl -s http://localhost:4000/health > /dev/null && curl -s http://localhost:5454/status > /dev/null; then
        echo ""
        echo "✅ Both servers started successfully!"
        echo "   Main Backend: http://localhost:4000 (PID: $MAIN_PID)"
        echo "   Bridge Server: http://localhost:5454 (PID: $BRIDGE_PID)"
        echo ""
        echo "📝 Logs:"
        echo "   Main server: tail -f /tmp/scriptify-server.log"
        echo "   Bridge server: tail -f /tmp/scriptify-bridge.log"
        echo ""
        echo "🛑 To stop: pkill -f 'node.*server.cjs|node.*cliBridge'"
        echo ""
        exit 0
    else
        echo "⚠️  Servers started but endpoints not responding. Check logs:"
        echo "   tail -20 /tmp/scriptify-server.log"
        echo "   tail -20 /tmp/scriptify-bridge.log"
        exit 1
    fi
else
    echo "❌ Failed to start servers. Check logs:"
    echo "   tail -20 /tmp/scriptify-server.log"
    echo "   tail -20 /tmp/scriptify-bridge.log"
    exit 1
fi

