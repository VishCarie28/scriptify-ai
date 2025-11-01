#!/bin/bash

# Scriptify AI Setup Script
# This script sets up the complete development environment

set -e  # Exit on any error

echo "🎬 Scriptify AI - Setup Script"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on macOS, Linux, or Windows
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="windows"
    else
        OS="unknown"
    fi
    print_status "Detected OS: $OS"
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
    else
        print_error "Node.js is not installed. Please install Node.js >= 16.0.0"
        exit 1
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
    else
        print_error "Python3 is not installed. Please install Python >= 3.8"
        exit 1
    fi
    
    # Check pip
    if command -v pip3 &> /dev/null; then
        print_success "pip3 found"
    else
        print_error "pip3 is not installed. Please install pip3"
        exit 1
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        print_success "Git found"
    else
        print_error "Git is not installed. Please install Git"
        exit 1
    fi
}

# Install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    npm install
    print_success "Node.js dependencies installed"
}

# Install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    pip3 install -r requirements.txt
    print_success "Python dependencies installed"
}

# Install Playwright browsers
install_playwright() {
    print_status "Installing Playwright browsers..."
    python3 -m playwright install
    print_success "Playwright browsers installed"
}

# Install Allure
install_allure() {
    print_status "Installing Allure..."
    
    if command -v allure &> /dev/null; then
        print_success "Allure already installed"
        return
    fi
    
    case $OS in
        "macos")
            if command -v brew &> /dev/null; then
                brew install allure
            else
                npm install -g allure-commandline
            fi
            ;;
        "linux")
            npm install -g allure-commandline
            ;;
        "windows")
            npm install -g allure-commandline
            ;;
        *)
            print_warning "Unknown OS. Please install Allure manually: https://docs.qameta.io/allure/#_installing_a_commandline"
            ;;
    esac
    
    if command -v allure &> /dev/null; then
        print_success "Allure installed successfully"
    else
        print_warning "Allure installation may have failed. Please install manually if needed."
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p allure-results
    mkdir -p allure-report
    mkdir -p screenshots
    mkdir -p videos
    mkdir -p logs
    
    print_success "Directories created"
}

# Setup environment file
setup_environment() {
    print_status "Setting up environment configuration..."
    
    if [ ! -f .env ]; then
        cp config/env.example .env
        print_success "Environment file created from template"
    else
        print_warning "Environment file already exists, skipping"
    fi
}

# Make scripts executable
make_executable() {
    print_status "Making scripts executable..."
    
    chmod +x run_tests.py
    chmod +x stop-server.js
    
    print_success "Scripts made executable"
}

# Run initial test
run_initial_test() {
    print_status "Running initial test to verify setup..."
    
    # Check if we can import required modules
    python3 -c "
import sys
try:
    import playwright
    import pytest
    import allure
    print('✅ All Python modules imported successfully')
except ImportError as e:
    print(f'❌ Failed to import module: {e}')
    sys.exit(1)
"
    
    print_success "Initial test passed"
}

# Display next steps
show_next_steps() {
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Start the backend server:"
    echo "   npm start"
    echo ""
    echo "2. Install the Chrome extension:"
    echo "   - Open Chrome and go to chrome://extensions/"
    echo "   - Enable 'Developer mode'"
    echo "   - Click 'Load unpacked' and select the 'frontend/' folder"
    echo ""
    echo "3. Run tests:"
    echo "   npm test"
    echo "   or"
    echo "   python scripts/run_tests.py"
    echo ""
    echo "4. Generate analytics reports:"
    echo "   Use the Chrome extension's 'Generate Analytics' button"
    echo ""
    echo "For more information, see the README.md file"
}

# Main execution
main() {
    detect_os
    check_prerequisites
    install_node_deps
    install_python_deps
    install_playwright
    install_allure
    create_directories
    setup_environment
    make_executable
    run_initial_test
    show_next_steps
}

# Run main function
main "$@"
