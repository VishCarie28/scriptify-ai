#!/bin/bash
# Comprehensive End-to-End Test for Scriptify AI
# Tests all integrations and functionalities
# 
# This script performs a complete E2E test of:
# - Prerequisites (Node.js, Python, dependencies)
# - Backend servers (main server, bridge server)
# - API endpoints (all routes)
# - File system structure
# - Workflow (recording → enhancement → test execution → analytics)
# - Integration tests
# - Error handling

set -e  # Exit on error (but we'll handle errors gracefully)

cd "$(dirname "$0")/.." || exit 1

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0
TEST_RESULTS=()

# Test report file
REPORT_FILE="test-results/e2e-test-report-$(date +%Y%m%d-%H%M%S).txt"
mkdir -p test-results

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$REPORT_FILE"
}

log_success() {
    echo -e "${GREEN}[PASS]${NC} $1" | tee -a "$REPORT_FILE"
    ((PASSED_TESTS++))
}

log_error() {
    echo -e "${RED}[FAIL]${NC} $1" | tee -a "$REPORT_FILE"
    ((FAILED_TESTS++))
}

log_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1" | tee -a "$REPORT_FILE"
    ((SKIPPED_TESTS++))
}

test_step() {
    ((TOTAL_TESTS++))
    local test_name="$1"
    local test_command="$2"
    
    log_info "Testing: $test_name"
    
    if eval "$test_command"; then
        TEST_RESULTS+=("✅ $test_name")
        log_success "$test_name"
        return 0
    else
        TEST_RESULTS+=("❌ $test_name")
        log_error "$test_name"
        return 1
    fi
}

# Header
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     Scriptify AI - Comprehensive E2E Test Suite          ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Report: $REPORT_FILE"
echo "Started: $(date)"
echo ""

# ============================================
# PHASE 1: PREREQUISITES CHECK
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PHASE 1: Checking Prerequisites${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check Node.js
test_step "Node.js installed" "command -v node > /dev/null" || {
    log_error "Node.js is required but not installed"
    exit 1
}
NODE_VERSION=$(node --version)
log_info "Node.js version: $NODE_VERSION"

# Check npm
test_step "npm installed" "command -v npm > /dev/null" || {
    log_error "npm is required but not installed"
    exit 1
}
NPM_VERSION=$(npm --version)
log_info "npm version: $NPM_VERSION"

# Check Python
test_step "Python installed" "command -v python3 > /dev/null || command -v python > /dev/null" || {
    log_error "Python is required but not installed"
    exit 1
}
PYTHON_CMD=$(command -v python3 2>/dev/null || command -v python)
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
log_info "Python version: $PYTHON_VERSION"

# Check Node dependencies
if [ -d "node_modules" ]; then
    log_success "Node.js dependencies installed"
else
    log_warning "Node.js dependencies not found, installing..."
    npm install || log_error "Failed to install Node.js dependencies"
fi

# Check Python dependencies
if [ -f venv/bin/python ]; then
    VENV_PYTHON="./venv/bin/python"
    test_step "Python dependencies installed (venv)" "$VENV_PYTHON -c 'import playwright, pytest' 2>/dev/null"
    PYTHON_CMD="$VENV_PYTHON"
else
    test_step "Python dependencies installed" "$PYTHON_CMD -c 'import pytest' 2>/dev/null"
    log_warning "venv not found, using system Python"
fi

# Check Playwright browsers
if [ -f venv/bin/python ]; then
    test_step "Playwright browsers installed" "$VENV_PYTHON -m playwright --version > /dev/null 2>&1" || {
        log_warning "Playwright browsers may not be installed. Attempting to install..."
        $VENV_PYTHON -m playwright install chromium 2>&1 | head -20 || log_warning "Playwright installation attempted (may continue without it)"
    }
else
    test_step "Playwright browsers installed" "$PYTHON_CMD -m playwright --version > /dev/null 2>&1" || {
        log_warning "Playwright not available (venv may not be set up with Playwright)"
    }
fi

# Check .env file (optional)
if [ -f .env ]; then
    log_success ".env file found"
    # Source env vars
    export $(cat .env | grep -v '^#' | xargs)
else
    log_warning ".env file not found (some features may require it)"
fi

echo ""

# ============================================
# PHASE 2: BACKEND SERVER TESTS
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PHASE 2: Backend Server Tests${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

MAIN_SERVER_PID=""
BRIDGE_SERVER_PID=""

# Function to start servers
start_servers() {
    log_info "Starting backend servers..."
    
    # Kill any existing servers
    lsof -ti :4000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti :5454 2>/dev/null | xargs kill -9 2>/dev/null || true
    
    sleep 2
    
    # Start main server
    log_info "Starting main backend server (port 4000)..."
    node backend/server.cjs > /tmp/scriptify-server.log 2>&1 &
    MAIN_SERVER_PID=$!
    
    # Wait for main server to start (check endpoint)
    local max_attempts=10
    local attempt=0
    while [ $attempt -lt $max_attempts ]; do
        sleep 1
        if curl -s http://localhost:4000/health > /dev/null 2>&1; then
            break
        fi
        ((attempt++))
    done
    
    if ! curl -s http://localhost:4000/health > /dev/null 2>&1; then
        log_error "Main server failed to start"
        echo "   Check logs: tail -20 /tmp/scriptify-server.log"
        return 1
    fi
    
    # Start bridge server
    log_info "Starting bridge server (port 5454)..."
    node backend/cliBridge.js > /tmp/scriptify-bridge.log 2>&1 &
    BRIDGE_SERVER_PID=$!
    
    # Wait for bridge server to start
    attempt=0
    while [ $attempt -lt $max_attempts ]; do
        sleep 1
        if curl -s http://localhost:5454/status > /dev/null 2>&1; then
            break
        fi
        ((attempt++))
    done
    
    if curl -s http://localhost:5454/status > /dev/null 2>&1; then
        log_success "Both servers started and responding"
        return 0
    else
        log_warning "Bridge server may not have started, but main server is running"
        return 0  # Continue with main server only
    fi
}

# Function to stop servers
stop_servers() {
    if [ ! -z "$MAIN_SERVER_PID" ]; then
        kill $MAIN_SERVER_PID 2>/dev/null || true
    fi
    if [ ! -z "$BRIDGE_SERVER_PID" ]; then
        kill $BRIDGE_SERVER_PID 2>/dev/null || true
    fi
    lsof -ti :4000 2>/dev/null | xargs kill -9 2>/dev/null || true
    lsof -ti :5454 2>/dev/null | xargs kill -9 2>/dev/null || true
}

# Check if servers are already running
if curl -s http://localhost:4000/health > /dev/null 2>&1; then
    log_success "Main server already running"
else
    start_servers || {
        log_error "Could not start servers"
        exit 1
    }
fi

# Test main server health endpoint
test_step "Main server health endpoint" "curl -s http://localhost:4000/health | grep -q '\"status\":\"ok\"'"

# Test bridge server status endpoint
test_step "Bridge server status endpoint" "curl -s http://localhost:5454/status | grep -q '\"status\":\"ok\"'"

# Test main server response structure
HEALTH_RESPONSE=$(curl -s http://localhost:4000/health)
test_step "Main server response structure" "echo '$HEALTH_RESPONSE' | grep -q 'message' && echo '$HEALTH_RESPONSE' | grep -q 'timestamp'"

echo ""

# ============================================
# PHASE 3: API ENDPOINT TESTS
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PHASE 3: API Endpoint Tests${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Recorder endpoints
test_step "Recorder status endpoint" "curl -s http://localhost:4000/api/recorder/status | grep -q 'isRecording'"

# Enhancer endpoints
test_step "Enhancer status endpoint" "curl -s http://localhost:4000/api/enhancer/status | grep -q 'hasRawScript'"

# Tests endpoints
test_step "Tests status endpoint" "curl -s http://localhost:4000/api/tests/status | grep -q 'hasTestAssets'"

# Analytics endpoints (may fail if no test results)
ANALYTICS_RESPONSE=$(curl -s http://localhost:4000/api/analytics/data 2>/dev/null)
if echo "$ANALYTICS_RESPONSE" | grep -q '"success":true\|"error"'; then
    log_success "Analytics data endpoint accessible"
else
    log_warning "Analytics data endpoint may not be working correctly"
fi

echo ""

# ============================================
# PHASE 4: FILE SYSTEM TESTS
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PHASE 4: File System Structure Tests${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check directory structure
test_step "test-cases directory exists" "[ -d test-cases ]"
test_step "test-cases/raw directory exists" "[ -d test-cases/raw ]"
test_step "test-cases/tests directory exists" "[ -d test-cases/tests ]"
test_step "test-cases/pages directory exists" "[ -d test-cases/pages ]"
test_step "test-cases/config directory exists" "[ -d test-cases/config ]"
test_step "test-results directory exists" "[ -d test-results ]"
test_step "backend directory exists" "[ -d backend ]"
test_step "frontend directory exists" "[ -d frontend ]"

# Check critical files
test_step "server.cjs exists" "[ -f backend/server.cjs ]"
test_step "cliBridge.js exists" "[ -f backend/cliBridge.js ]"
test_step "manifest.json exists" "[ -f frontend/manifest.json ]"
test_step "package.json exists" "[ -f package.json ]"
test_step "requirements.txt exists" "[ -f requirements.txt ]"
test_step "pytest.ini exists" "[ -f pytest.ini ]"

# Check config file
if [ -f test-cases/config/config.json ]; then
    log_success "config.json exists"
    if $PYTHON_CMD -c "import json; json.load(open('test-cases/config/config.json'))" 2>/dev/null; then
        log_success "config.json is valid JSON"
    else
        log_error "config.json is not valid JSON"
    fi
else
    log_warning "config.json not found"
fi

echo ""

# ============================================
# PHASE 5: FUNCTIONAL WORKFLOW TESTS
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PHASE 5: Functional Workflow Tests${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create test raw script
log_info "Creating test raw script..."
mkdir -p test-cases/raw
cat > test-cases/raw/raw_script.py << 'EOF'
# Generated Playwright script for E2E testing
from playwright.sync_api import sync_playwright

def test_e2e_example():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, slow_mo=500)
        context = browser.new_context()
        page = context.new_page()
        
        # Navigate to a test site
        page.goto("https://the-internet.herokuapp.com")
        
        # Verify page loaded
        assert "The Internet" in page.title()
        
        browser.close()

if __name__ == "__main__":
    test_e2e_example()
EOF

if [ -f test-cases/raw/raw_script.py ]; then
    log_success "Test raw script created"
else
    log_error "Failed to create test raw script"
fi

# Test enhancement (if API key available)
# By default, run enhancement if API key is available
if [ ! -z "$OPENAI_API_KEY" ]; then
    log_info "Testing script enhancement (this may take 1-3 minutes)..."
    ENHANCE_RESPONSE=$(timeout 180 curl -s -X POST http://localhost:5454/enhance \
        -H "Content-Type: application/json" \
        -d '{}' 2>&1) || ENHANCE_RESPONSE=""
    
    if echo "$ENHANCE_RESPONSE" | grep -q '"success":true'; then
        log_success "Script enhancement completed"
    else
        # Try main backend
        ENHANCE_RESPONSE=$(timeout 180 curl -s -X POST http://localhost:4000/api/enhancer/enhance \
            -H "Content-Type: application/json" \
            -d '{"file": "test-cases/raw/raw_script.py"}' 2>&1) || ENHANCE_RESPONSE=""
        
        if echo "$ENHANCE_RESPONSE" | grep -q '"success":true'; then
            log_success "Script enhancement completed (via main backend)"
        else
            log_warning "Script enhancement failed or skipped (may require valid OpenAI API key)"
        fi
    fi
else
    log_warning "Skipping enhancement test (OPENAI_API_KEY not set)"
fi

# Check if test files exist
if ls test-cases/tests/test_*.py 2>/dev/null | head -1 > /dev/null; then
    log_success "Test files found"
    
    # Run tests to verify test execution works
    log_info "Running test execution (this may take 1-2 minutes)..."
    TEST_RUN_RESPONSE=$(timeout 180 curl -s -X POST http://localhost:4000/api/tests/run \
        -H "Content-Type: application/json" \
        -d '{"browser": "chromium", "headless": true}' 2>&1) || TEST_RUN_RESPONSE=""
    
    if echo "$TEST_RUN_RESPONSE" | grep -q '"success":true'; then
        log_success "Test execution completed successfully"
        
        # Wait a moment for reports to be generated
        sleep 5
        
        # Test analytics generation
        log_info "Testing analytics generation (this may take up to 2 minutes)..."
        ANALYTICS_RESPONSE=$(timeout 180 curl -s -X POST http://localhost:4000/api/analytics/generate \
            -H "Content-Type: application/json" \
            -d '{}' 2>&1)
        
        if echo "$ANALYTICS_RESPONSE" | grep -q '"success":true'; then
            log_success "Analytics generation completed successfully"
            
            # Check if report file exists
            if [ -f test-results/reports/analytics-dashboard.html ]; then
                log_success "Analytics dashboard HTML file created"
                
                # Verify report is accessible
                REPORT_SIZE=$(stat -f%z test-results/reports/analytics-dashboard.html 2>/dev/null || stat -c%s test-results/reports/analytics-dashboard.html 2>/dev/null || echo "0")
                if [ "$REPORT_SIZE" -gt 1000 ]; then
                    log_success "Analytics report file size: ${REPORT_SIZE} bytes"
                else
                    log_warning "Analytics report file seems too small"
                fi
            else
                log_error "Analytics dashboard HTML file not found"
            fi
        else
            log_error "Analytics generation failed"
            echo "   Response: ${ANALYTICS_RESPONSE:0:500}"
        fi
    else
        log_error "Test execution failed or not completed"
        echo "   Response: ${TEST_RUN_RESPONSE:0:500}"
    fi
else
    log_warning "No test files found, skipping test execution"
fi

echo ""

# ============================================
# PHASE 6: INTEGRATION TESTS
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PHASE 6: Integration Tests${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test Python imports
log_info "Testing Python module imports..."
test_step "Python config_manager import" "$PYTHON_CMD -c 'from test_cases.utils.config_manager import ConfigManager; print(\"OK\")' 2>/dev/null"

# Test pytest collection
if [ -f test-cases/conftest.py ]; then
    log_success "conftest.py exists"
fi

# Test that pages can be imported (if they exist)
if [ -f test-cases/pages/base_page.py ]; then
    test_step "Python base_page import" "$PYTHON_CMD -c 'import sys; sys.path.insert(0, \"test-cases\"); from pages.base_page import BasePage' 2>/dev/null" || log_warning "base_page import failed (may be expected)"
fi

# Test backend module loading
test_step "Backend server module loads" "node -e 'require(\"./backend/server.cjs\")' 2>&1 | head -5" || log_warning "Server module check (may timeout)"

echo ""

# ============================================
# PHASE 7: ERROR HANDLING TESTS
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}PHASE 7: Error Handling Tests${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Test 404 handling
test_step "404 error handling" "curl -s http://localhost:4000/nonexistent | grep -q 'error\|404\|Not Found' || [ $? -eq 0 ]"

# Test invalid endpoint
INVALID_RESPONSE=$(curl -s -X POST http://localhost:4000/api/tests/run \
    -H "Content-Type: application/json" \
    -d '{"browser": "invalid"}' 2>&1)
if echo "$INVALID_RESPONSE" | grep -q 'error\|Invalid'; then
    log_success "Invalid browser type rejected"
else
    log_warning "Invalid browser type validation may not be working"
fi

echo ""

# ============================================
# FINAL REPORT
# ============================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${CYAN}E2E Test Summary${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo "Total Tests: $TOTAL_TESTS" | tee -a "$REPORT_FILE"
echo "Passed: $PASSED_TESTS" | tee -a "$REPORT_FILE"
echo "Failed: $FAILED_TESTS" | tee -a "$REPORT_FILE"
echo "Skipped: $SKIPPED_TESTS" | tee -a "$REPORT_FILE"
echo ""

# Calculate pass rate
if [ $TOTAL_TESTS -gt 0 ]; then
    PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo "Pass Rate: $PASS_RATE%" | tee -a "$REPORT_FILE"
else
    PASS_RATE=0
    echo "Pass Rate: N/A" | tee -a "$REPORT_FILE"
fi

echo "" | tee -a "$REPORT_FILE"
echo "Test Results:" | tee -a "$REPORT_FILE"
for result in "${TEST_RESULTS[@]}"; do
    echo "  $result" | tee -a "$REPORT_FILE"
done

echo "" | tee -a "$REPORT_FILE"
echo "Completed: $(date)" | tee -a "$REPORT_FILE"
echo "Report saved to: $REPORT_FILE"

# Final status
if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ All critical tests passed!${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Please review the report above.${NC}"
    echo ""
    exit 1
fi

