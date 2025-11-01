#!/usr/bin/env python3
"""
Test runner script for Scriptify AI Python tests.
"""
import os
import sys
import subprocess
import argparse
from pathlib import Path


def run_command(command, cwd=None):
    """Run a command and return the result."""
    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=cwd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        return {
            'returncode': result.returncode,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
    except subprocess.TimeoutExpired:
        return {
            'returncode': -1,
            'stdout': '',
            'stderr': 'Command timed out after 5 minutes'
        }


def install_playwright_browsers():
    """Install Playwright browsers if not already installed."""
    print("Installing Playwright browsers...")
    result = run_command("playwright install")
    if result['returncode'] != 0:
        print(f"Warning: Failed to install Playwright browsers: {result['stderr']}")
    else:
        print("Playwright browsers installed successfully")


def run_tests(args):
    """Run the test suite with given arguments."""
    # Change to project root directory
    project_root = Path(__file__).parent.parent
    os.chdir(project_root)
    print(f"Changed to project root: {project_root}")
    
    # Install Playwright browsers if needed
    if args.install_browsers:
        install_playwright_browsers()
    
    # Build pytest command
    cmd_parts = ["python", "-m", "pytest", "test-cases/tests/", "-v"]
    
    # Add browser option
    if args.browser:
        cmd_parts.extend(["--browser", args.browser])
    
    # Add headless option
    env = os.environ.copy()
    if args.headless:
        env["HEADLESS"] = "true"
    else:
        env["HEADLESS"] = "false"
    
    # Add parallel execution
    if args.parallel > 1:
        cmd_parts.extend(["-n", str(args.parallel)])
    
    # Add tags for filtering
    if args.tags:
        cmd_parts.extend(["-m", args.tags])
    
    # Add video recording
    if args.video:
        cmd_parts.append("--video=on")
    
    # Add screenshots
    if args.screenshots:
        cmd_parts.append("--screenshot=on")
    
    # Add Allure reporting
    cmd_parts.extend(["--alluredir", "allure-reports/results"])
    
    # Add HTML report
    cmd_parts.extend(["--html", "test-results/reports/pytest-report.html", "--self-contained-html"])
    
    # Add pytest configuration file
    cmd_parts.extend(["-c", "config/pytest.ini"])
    
    # Add collect-only flag
    if args.collect_only:
        cmd_parts.append("--collect-only")
    
    # Add specific test file if provided
    if args.test_file:
        cmd_parts = ["python", "-m", "pytest", args.test_file, "-v"]
        if args.collect_only:
            cmd_parts.append("--collect-only")
    
    # Run the command
    print(f"Running command: {' '.join(cmd_parts)}")
    
    # Ensure directories exist before running
    os.makedirs("test-results/reports", exist_ok=True)
    os.makedirs("allure-reports/results", exist_ok=True)
    
    result = subprocess.run(
        cmd_parts,
        env=env,
        cwd=project_root
    )
    
    return result.returncode


def main():
    parser = argparse.ArgumentParser(description="Scriptify AI Test Runner")
    parser.add_argument("--browser", type=str, choices=["chromium", "firefox", "webkit"],
                        help="Browser to use for tests")
    parser.add_argument("--headless", action="store_true",
                        help="Run tests in headless mode")
    parser.add_argument("--parallel", type=int, default=1,
                        help="Number of parallel workers")
    parser.add_argument("--tags", type=str,
                        help="Test tags to run (e.g., smoke, regression)")
    parser.add_argument("--video", action="store_true",
                        help="Record video of test execution")
    parser.add_argument("--screenshots", action="store_true",
                        help="Take screenshots during tests")
    parser.add_argument("--test-file", type=str,
                        help="Specific test file to run")
    parser.add_argument("--install-browsers", action="store_true",
                        help="Install Playwright browsers")
    parser.add_argument("--debug", action="store_true",
                        help="Run in debug mode")
    parser.add_argument("--collect-only", action="store_true",
                        help="Only collect tests, don't run them")
    
    args = parser.parse_args()
    
    # Create necessary directories
    os.makedirs("allure-reports/results", exist_ok=True)
    os.makedirs("allure-reports/reports", exist_ok=True)
    os.makedirs("test-results/reports", exist_ok=True)
    os.makedirs("test-results/screenshots", exist_ok=True)
    os.makedirs("test-results/videos", exist_ok=True)
    os.makedirs("test-results/logs", exist_ok=True)
    
    # Run tests
    exit_code = run_tests(args)
    
    if exit_code == 0:
        print("✅ All tests passed!")
    else:
        print("❌ Some tests failed!")
    
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
