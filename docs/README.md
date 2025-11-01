# 🎬 Scriptify AI - AI-Powered Test Automation Framework

**AI-powered test automation tool that records browser interactions and converts them into production-ready Page Object Model (POM) test cases**

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/python-%3E%3D3.8-blue)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-ISC-green)](LICENSE)

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Usage Guide](#-usage-guide)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Configuration](#-configuration)
- [Development](#-development)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🎯 Overview

Scriptify AI is an intelligent test automation framework that simplifies the process of creating and maintaining automated tests. Instead of manually writing test code, you can:

1. **Record** your test interactions using the Chrome extension
2. **Enhance** raw scripts into production-ready Python Page Object Model tests using AI
3. **Execute** tests with pytest and Playwright
4. **Analyze** results with comprehensive analytics dashboards
5. **Integrate** with CI/CD pipelines (Jenkins support)

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Record    │ --> │   Enhance   │ --> │    Test     │ --> │   Analytics │
│  Interactions│     │  with AI    │     │  Execution  │     │  Dashboard  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     Browser              OpenAI           Pytest/Playwright      HTML Reports
     Extension            GPT-4            Python Tests            Charts & Metrics
```

## ✨ Key Features

### 🎥 Recording
- **One-Click Recording**: Record user interactions directly from Chrome browser
- **Smart Capture**: Automatically captures clicks, form fills, navigation, and more
- **Real-time Preview**: See recorded actions as they happen

### 🤖 AI-Powered Enhancement
- **Intelligent Conversion**: Converts raw Playwright scripts into structured Page Object Model tests
- **Best Practices**: Generates production-ready code following industry standards
- **Multi-File Structure**: Automatically creates:
  - Page Object classes
  - Test files with proper structure
  - Configuration files
  - Utility modules
  - Base page classes
- **Cursor IDE Integration**: Works seamlessly with Cursor IDE:
  - Uses `.cursor/rules` for project-specific code generation guidelines
  - Provides Cursor commands for manual enhancement
  - Automatic validation pipelines for generated code

### 🧪 Test Execution
- **Multi-Browser Support**: Run tests on Chromium, Firefox, and WebKit
- **Headed/Headless Modes**: Execute with or without browser UI
- **Parallel Execution**: Run multiple tests simultaneously
- **Video & Screenshot Capture**: Automatic capture on failures
- **Detailed Logging**: Comprehensive test execution logs

### 📊 Analytics & Reporting
- **Comprehensive Dashboards**: Interactive HTML reports with:
  - Test execution metrics
  - Performance analytics
  - Coverage analysis
  - Visual charts and graphs
- **Test Insights**: Automated insights and recommendations
- **Historical Data**: Track test execution over time

### 🔧 Easy Integration
- **Chrome Extension Interface**: Seamless browser-based workflow
- **RESTful API**: Full programmatic access
- **CI/CD Ready**: Jenkins pipeline integration
- **CLI Bridge**: Dual-server architecture for flexibility

## 🏗️ Architecture

Scriptify AI uses a dual-server architecture:

### Backend Services

1. **Main Backend Server** (Port 4000)
   - REST API for all operations
   - Test execution management
   - Analytics generation
   - Jenkins integration
   - Static file serving

2. **CLI Bridge Server** (Port 5454)
   - Lightweight enhancement service
   - Auto-detection of scripts
   - Direct AI integration
   - Simplified endpoint structure

### Components

- **Frontend**: Chrome Extension (JavaScript)
- **Backend**: Node.js + Express.js (REST API)
- **AI Engine**: OpenAI GPT-4 (for script enhancement)
- **Test Framework**: Python + pytest + Playwright
- **Reporting**: Custom HTML dashboards with Chart.js
- **Cursor IDE Integration**: `.cursor/` folder contains:
  - Rules for AI code generation (`rules`, `enhancer_rules.json`)
  - Commands for Cursor IDE (`commands.json`)
  - Validation pipelines (`pipelines/enhancer_validation.yaml`)

## 📦 Installation

### Prerequisites

- **Node.js** >= 16.0.0
- **Python** >= 3.8
- **npm** >= 8.0.0
- **Chrome Browser** (for extension)

### Step-by-Step Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vishalsingh/scriptify-ai.git
   cd scriptify-ai
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   # or
   pip3 install -r requirements.txt
   ```

4. **Install Playwright browsers**
   ```bash
   python -m playwright install
   # or
   python3 -m playwright install
   ```

5. **Set up environment variables**
   ```bash
   # Create .env file in project root
   # Required: OPENAI_API_KEY for AI enhancement
   OPENAI_API_KEY=your_openai_api_key_here
   NODE_ENV=development
   PORT=4000
   ```

6. **Install Chrome Extension**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `frontend/` folder from the project directory

### Quick Setup Script

For automated setup, use the provided script:

```bash
bash scripts/setup.sh
```

This script will:
- Check prerequisites
- Install all dependencies
- Set up directories
- Install Playwright browsers
- Configure environment

## 🚀 Quick Start

### 1. Start the Servers

**Option A: Start both servers together**
```bash
npm run start:all
```

**Option B: Start servers separately**
```bash
# Terminal 1 - Main backend (port 4000)
npm start

# Terminal 2 - CLI Bridge (port 5454)
npm run start:bridge
```

### 2. Verify Installation

Check if servers are running:
```bash
# Check main backend
curl http://localhost:4000/health

# Check CLI bridge
curl http://localhost:5454/status
```

### 3. Use the Extension

1. Click the **Scriptify AI** extension icon in Chrome
2. The panel will appear on your current page
3. Follow the sequential workflow:
   - 🎥 **Start Recording** → Record your interactions
   - 🛑 **Stop & Save** → Save the raw script
   - ✨ **Enhance Script** → Convert to POM (requires OpenAI API key)
   - 🧪 **Run Tests** → Execute generated tests
   - 📈 **Generate Analytics** → View detailed reports
   - 📊 **Open Analytics** → View dashboard in browser

## 📚 Usage Guide

### Recording Interactions

1. **Navigate** to the website you want to test
2. **Click** the Scriptify AI extension icon
3. **Click** "🎥 Start Recording"
4. **Perform** your test actions:
   - Click buttons
   - Fill forms
   - Navigate pages
   - Interact with elements
5. **Click** "🛑 Stop & Save" when done
6. The raw script is saved to `test-cases/raw/raw_script.py`

### Enhancing Scripts

The enhancement process uses AI to convert raw recordings into structured POM tests. You have **two options**:

#### Option 1: Via Chrome Extension (Recommended)

1. **Ensure** you have an OpenAI API key in `.env`
2. **Click** "✨ Enhance Script" in the extension
3. **Wait** for processing (may take 1-3 minutes)
4. **Review** generated files in `test-cases/`:
   - `pages/` - Page Object classes
   - `tests/` - Test files
   - `utils/` - Utility modules
   - `config/` - Configuration files

#### Option 2: Via Cursor IDE (Advanced)

If you use Cursor IDE, you can enhance scripts directly from the IDE:

1. **Open Cursor IDE** in the project directory
2. **Open Command Palette** (`Cmd/Ctrl + Shift + P`)
3. **Run** "Enhance Raw Script to POM" command
4. The command will:
   - Read `test-cases/raw/raw_script.py`
   - Follow rules in `.cursor/rules` and `.cursor/enhancer_rules.json`
   - Generate POM files following project-specific guidelines
   - Run validation pipeline automatically

**Note**: The enhancer automatically reads and applies `.cursor/rules` even when using the extension/API method, ensuring consistency across both workflows.

### Running Tests

#### Via Extension (Recommended)
1. **Click** "🧪 Run Tests" in the extension
2. Browser will open in **headed mode** (visible)
3. Watch tests execute
4. View results in the extension panel

#### Via Command Line
```bash
# Run all tests
npm test

# Run with specific options
python scripts/run_tests.py --browser firefox
python scripts/run_tests.py --headless
python scripts/run_tests.py --parallel 4

# Run single test file
python scripts/run_tests.py test_cases/tests/test_login.py
```

### Viewing Analytics

1. **After running tests**, click "📈 Generate Analytics"
2. **Wait** for report generation (may take 1-2 minutes)
3. **Click** "📊 Open Analytics" to view dashboard
4. Dashboard includes:
   - Test execution summary
   - Performance metrics
   - Coverage analysis
   - Visual charts

### Jenkins Integration

1. **Configure** Jenkins credentials in `.env`:
   ```env
   JENKINS_URL=http://your-jenkins-server:8080
   JENKINS_JOB_NAME=scriptify-ai-tests
   JENKINS_USER=your_username
   JENKINS_API_TOKEN=your_api_token
   ```

2. **Click** "🚀 Trigger Jenkins" in extension
3. **Monitor** job execution in Jenkins dashboard

## 📁 Project Structure

```
scriptify-ai/
├── backend/                    # Node.js backend services
│   ├── cliBridge.js           # CLI Bridge server (port 5454)
│   ├── server.cjs             # Main backend server (port 4000)
│   ├── config/                # Configuration files
│   │   ├── constants.cjs      # Application constants
│   │   └── environment.cjs    # Environment configuration
│   ├── controllers/           # Route controllers
│   │   ├── analytics.controller.cjs
│   │   ├── enhancer.controller.js
│   │   ├── enhancer-wrapper.cjs
│   │   ├── jenkins.controller.cjs
│   │   ├── recorder.controller.cjs
│   │   └── tests.controller.cjs
│   ├── routes/                # Express routes
│   │   ├── analytics.routes.cjs
│   │   ├── enhancer.routes.cjs
│   │   ├── jenkins.routes.cjs
│   │   ├── recorder.routes.cjs
│   │   └── tests.routes.cjs
│   └── utils/                 # Utility modules
│       ├── console-helper.cjs
│       ├── error-handler.cjs
│       ├── logger.cjs
│       ├── template-html-report.cjs
│       ├── test-analytics.cjs
│       └── test-results-parser.cjs
│
├── frontend/                   # Chrome extension
│   ├── background.js           # Service worker
│   ├── inject-panel.js        # Main panel script
│   ├── panel.css              # Panel styling
│   ├── manifest.json          # Extension manifest
│   └── icon.png               # Extension icon
│
├── test-cases/                 # Generated test files
│   ├── config/                 # Test configuration
│   │   └── config.json
│   ├── data/                   # Test data
│   │   ├── __init__.py
│   │   └── testdata.json
│   ├── pages/                  # Page Object classes
│   │   ├── base_page.py
│   │   ├── home_page.py
│   │   └── login_page.py
│   ├── raw/                    # Raw recorded scripts
│   │   └── raw_script.py
│   ├── tests/                   # Test files
│   │   └── test_*.py
│   ├── utils/                  # Utility modules
│   │   ├── __init__.py
│   │   └── config_manager.py
│   └── conftest.py            # Pytest configuration
│
├── test-results/               # Test execution results
│   ├── analytics/              # Analytics data files
│   ├── reports/                # HTML reports
│   │   └── analytics-dashboard.html
│   ├── screenshots/            # Screenshots (on failure)
│   └── videos/                 # Videos (on failure)
│
├── scripts/                    # Utility scripts
│   ├── setup.sh                # Setup script
│   ├── start-servers.sh        # Start both servers
│   ├── stop-all-servers.sh     # Stop all servers
│   ├── run_tests.py            # Test execution script
│   └── stop-server.js           # Server stop utility
│
├── config/                     # Configuration files
│   └── jenkins.groovy          # Jenkins pipeline config
│
├── .cursor/                      # Cursor IDE integration
│   ├── commands.json           # Cursor commands for enhancement
│   ├── rules                    # Code generation rules for AI
│   ├── enhancer_rules.json     # Structured enhancement rules
│   └── pipelines/              # Validation pipelines
│       └── enhancer_validation.yaml
│
├── docs/                       # Documentation
│   └── README.md               # This file
│
├── package.json                # Node.js dependencies
├── requirements.txt            # Python dependencies
├── pytest.ini                  # Pytest configuration
└── .env                        # Environment variables (create this)
```

## 🔌 API Documentation

### Main Backend (Port 4000)

#### Recorder Endpoints

- **POST** `/api/recorder/start`
  - Start recording browser interactions
  - Body: `{ "url": "https://example.com" }`

- **POST** `/api/recorder/stop`
  - Stop recording and save script
  - Returns: `{ "rawScript": "...", "filePath": "..." }`

- **GET** `/api/recorder/status`
  - Get current recording status
  - Returns: `{ "isRecording": boolean }`

#### Enhancer Endpoints

- **POST** `/api/enhancer/enhance`
  - Enhance raw script to POM
  - Body: `{ "file": "path/to/raw_script.py" }` (optional - auto-detects)
  - Returns: Generated files structure

- **GET** `/api/enhancer/status`
  - Get enhancement status
  - Returns: `{ "hasRawScript": boolean }`

#### Test Execution Endpoints

- **POST** `/api/tests/run`
  - Run test suite
  - Body: `{ "browser": "chromium", "headless": false, "parallel": 1 }`
  - Returns: Test execution results

- **GET** `/api/tests/status`
  - Get test execution status
  - Returns: Current test status

#### Analytics Endpoints

- **POST** `/api/analytics/generate`
  - Generate analytics report
  - Returns: Analytics data and report path

- **GET** `/api/analytics/data`
  - Get analytics data
  - Returns: Metrics and test results

- **GET** `/api/analytics/open`
  - Open analytics dashboard in browser
  - Returns: Report path

- **GET** `/api/analytics/insights`
  - Get test insights
  - Returns: Automated insights and recommendations

- **GET** `/api/analytics/performance`
  - Get performance metrics
  - Returns: Performance data

#### Jenkins Endpoints

- **POST** `/api/jenkins/trigger`
  - Trigger Jenkins pipeline
  - Returns: Job information

- **GET** `/api/jenkins/status`
  - Get Jenkins job status
  - Returns: Job status and details

#### Health Check

- **GET** `/health`
  - Server health check
  - Returns: `{ "status": "ok", "message": "..." }`

### CLI Bridge (Port 5454)

**Note**: Despite the name "CLI Bridge", this server is primarily for the extension and API. For Cursor IDE integration, use the commands in `.cursor/commands.json`.

- **GET** `/status`
  - Bridge health check

- **POST** `/enhance`
  - Enhance script (auto-detects `test-cases/raw/raw_script.py`)
  - Body: `{}` or `{ "file": "path/to/script.py" }`
  - **Uses**: Automatically reads and applies `.cursor/rules` during enhancement

## ⚙️ Configuration

### Cursor IDE Integration

Scriptify AI integrates with **Cursor IDE** for enhanced code generation. The `.cursor/` folder contains:

#### `.cursor/rules`
Defines project-specific rules for AI code generation. The enhancer automatically reads this file and includes it in the AI prompt, ensuring all generated code follows your project's standards.

**Key Rules Include:**
- Page Object Model structure requirements
- Code quality standards (PEP8, type hints)
- Import conventions
- File naming conventions (snake_case)
- Assertion placement guidelines

#### `.cursor/enhancer_rules.json`
Structured rules for the enhancement process, including:
- AI prompt engineering guidelines
- File handling procedures
- Validation requirements
- Code formatting standards
- Quality checks

#### `.cursor/commands.json`
Cursor IDE commands that allow you to enhance scripts directly from the IDE:
- **"Enhance Raw Script to POM"**: Converts raw scripts using project rules

#### `.cursor/pipelines/enhancer_validation.yaml`
Automatic validation pipeline that runs after code generation:
- Syntax validation
- Import checking
- Code formatting (Black)
- Linting (Flake8)
- Pytest collection validation
- Structure validation
- Assertion placement checks

**How It Works:**
1. When you enhance via extension or API, the enhancer reads `.cursor/rules`
2. Rules are automatically injected into the AI prompt
3. Generated code follows your project-specific guidelines
4. Validation pipeline ensures quality

**Customizing Rules:**
Edit `.cursor/rules` to customize how the AI generates code for your specific project needs.

### Environment Variables

Create a `.env` file in the project root:

```env
# Server Configuration
NODE_ENV=development
PORT=4000
HOST=localhost

# OpenAI Configuration (Required for enhancement)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4
OPENAI_TEMPERATURE=0.1

# Test Configuration
BASE_URL=https://your-test-site.com/
BROWSER_TYPE=chromium
HEADLESS=false
SLOW_MO=1000
TIMEOUT=30000

# Jenkins Configuration (Optional)
JENKINS_URL=http://jenkins.example.com:8080
JENKINS_JOB_NAME=scriptify-ai-tests
JENKINS_USER=your_username
JENKINS_API_TOKEN=your_api_token
```

### Pytest Configuration

Edit `pytest.ini` for test execution settings:

- Browser selection
- Headless mode
- Screenshot/video capture
- Timeouts
- Markers for test categorization

### Extension Configuration

The extension uses configurable timeouts:

- **Default**: 30 seconds
- **Enhance**: 3 minutes (180 seconds)
- **Test Execution**: 15 minutes (900 seconds)
- **Analytics**: 2 minutes (120 seconds)

## 🛠️ Development

### Running in Development Mode

```bash
npm run dev
```

### Code Quality

```bash
# Lint JavaScript
npm run lint
npm run lint:fix

# Format code
npm run format
```

### Testing

```bash
# Run tests
npm test

# Run with options
npm run test:headless
npm run test:parallel
npm run test:firefox
npm run test:webkit
```

### Building Extension

```bash
npm run build:extension
```

### Clean Up

```bash
# Clean test artifacts
npm run clean

# Clean cache
npm run clean:cache

# Clean everything
npm run clean:all
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Server Won't Start

**Port already in use:**
```bash
# Find process using port
lsof -i :4000  # or :5454

# Kill process
kill <PID>

# Or use provided script
npm stop
```

#### 2. Extension Not Working

- **Reload extension**: Go to `chrome://extensions/` and click reload
- **Check servers**: Ensure both servers are running
- **Check console**: Open browser DevTools (F12) for errors

#### 3. Enhancement Fails

- **Check API key**: Ensure `OPENAI_API_KEY` is set in `.env`
- **Check network**: Verify internet connection for API calls
- **Check timeout**: Enhancement can take 1-3 minutes

#### 4. Tests Not Running

- **Install Playwright**: Run `python -m playwright install`
- **Check Python**: Ensure Python >= 3.8
- **Check dependencies**: Run `pip install -r requirements.txt`

#### 5. Analytics Generation Timeout

- **Timeout increased**: Analytics now has 2-minute timeout
- **Check test results**: Ensure tests have completed
- **Check HTML reports**: Review `test-results/reports/pytest-report.html` for test results

### Debug Mode

Enable verbose logging:

```bash
# Backend
NODE_ENV=development npm start

# Tests
python scripts/run_tests.py --debug
```

### Getting Help

1. Check browser console (F12)
2. Check server console output
3. Review HTML test reports in `test-results/reports/`
4. Open an issue on GitHub

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow existing code style
- Add comments for complex logic
- Update documentation for new features
- Write tests for new functionality
- Ensure all tests pass before submitting

## 📄 License

ISC License - See LICENSE file for details

## 👨‍💻 Author

**Vishal Singh**

- GitHub: [@vishalsingh](https://github.com/vishalsingh)
- Repository: [scriptify-ai](https://github.com/vishalsingh/scriptify-ai)

## 🙏 Acknowledgments

- Built with [Playwright](https://playwright.dev/) for browser automation
- Powered by [OpenAI GPT-4](https://openai.com/) for AI enhancement
- Uses [pytest](https://pytest.org/) for test execution
- Chart visualizations with [Chart.js](https://www.chartjs.org/)

---

**Made with ❤️ for the QA community**

**Happy Testing! 🎬✨**
