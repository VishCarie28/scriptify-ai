#!/bin/bash
# Stop all Scriptify AI servers (Main Backend + Bridge)
# Usage: ./scripts/stop-all-servers.sh

cd "$(dirname "$0")/.." || exit 1

echo "🛑 Stopping all Scriptify AI servers..."
echo ""

STOPPED_COUNT=0

# Function to stop process on a port
stop_port() {
    local port=$1
    local service_name=$2
    
    # Find process using the port
    local pid=$(lsof -ti :$port 2>/dev/null)
    
    if [ -z "$pid" ]; then
        echo "✅ $service_name (port $port): No process found"
        return 0
    fi
    
    echo "🛑 Stopping $service_name (port $port, PID: $pid)..."
    
    # Try graceful shutdown first (SIGTERM)
    kill -TERM $pid 2>/dev/null
    
    # Wait a bit for graceful shutdown
    sleep 2
    
    # Check if process is still running
    if kill -0 $pid 2>/dev/null; then
        echo "⚠️  Process still running, forcing shutdown (SIGKILL)..."
        kill -KILL $pid 2>/dev/null
        sleep 1
    fi
    
    # Verify it's stopped
    if ! kill -0 $pid 2>/dev/null; then
        echo "✅ $service_name stopped successfully"
        STOPPED_COUNT=$((STOPPED_COUNT + 1))
    else
        echo "⚠️  $service_name may still be running (check manually: lsof -i :$port)"
    fi
}

# Stop main backend server (port 4000)
stop_port 4000 "Main Backend Server"

# Stop bridge server (port 5454)
stop_port 5454 "Bridge Server"

# Also try to kill by process name (for processes started without port binding)
echo ""
echo "🧹 Cleaning up any remaining Node.js server processes..."

# Kill processes matching server files
pkill -f "node.*backend/server.cjs" 2>/dev/null && echo "✅ Killed main backend processes" || true
pkill -f "node.*backend/cliBridge.js" 2>/dev/null && echo "✅ Killed bridge server processes" || true

# Remove PID file if it exists
if [ -f ".server.pid" ]; then
    rm -f .server.pid
    echo "✅ Removed PID file"
fi

# Final verification
echo ""
echo "🔍 Verifying servers are stopped..."
MAIN_STILL_RUNNING=$(lsof -ti :4000 2>/dev/null | wc -l | tr -d ' ')
BRIDGE_STILL_RUNNING=$(lsof -ti :5454 2>/dev/null | wc -l | tr -d ' ')

if [ "$MAIN_STILL_RUNNING" -eq 0 ] && [ "$BRIDGE_STILL_RUNNING" -eq 0 ]; then
    echo "✅ All servers stopped successfully!"
    exit 0
else
    echo "⚠️  Warning: Some processes may still be running"
    [ "$MAIN_STILL_RUNNING" -gt 0 ] && echo "   Main backend (port 4000): Still running" || echo "   Main backend (port 4000): Stopped"
    [ "$BRIDGE_STILL_RUNNING" -gt 0 ] && echo "   Bridge server (port 5454): Still running" || echo "   Bridge server (port 5454): Stopped"
    echo ""
    echo "💡 To manually check: lsof -i :4000 -i :5454"
    exit 1
fi

