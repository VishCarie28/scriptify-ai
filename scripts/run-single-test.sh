#!/bin/bash
# Run a single test file
# Usage: ./scripts/run-single-test.sh test_checkout_process.py

cd "$(dirname "$0")/.." || exit 1

if [ -z "$1" ]; then
    echo "Usage: $0 <test_file_name>"
    echo "Example: $0 test_checkout_process.py"
    exit 1
fi

# Handle both just filename and full path
if [[ "$1" == test-cases/tests/* ]]; then
    TEST_FILE="$1"
else
    TEST_FILE="test-cases/tests/$1"
fi

if [ ! -f "$TEST_FILE" ]; then
    echo "❌ Test file not found: $TEST_FILE"
    echo ""
    echo "Available test files:"
    ls -1 test-cases/tests/*.py 2>/dev/null | sed 's|test-cases/tests/|  - |' || echo "  (none found)"
    exit 1
fi

# Activate venv if it exists
if [ -d "venv" ]; then
    source venv/bin/activate 2>/dev/null
fi

# Run with pytest (proper way - handles imports correctly)
echo "🧪 Running test: $TEST_FILE"
echo "📁 From project root: $(pwd)"
echo ""
shift  # Remove first argument (test file) and pass remaining args to pytest
python -m pytest "$TEST_FILE" -v "$@"

