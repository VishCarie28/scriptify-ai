"""
Pytest configuration and fixtures.
"""
import os
import shutil
import sys
import pytest
from playwright.sync_api import sync_playwright

# PERMANENT CACHE PREVENTION - Set at module level
os.environ['PYTHONDONTWRITEBYTECODE'] = '1'
os.environ['PYTHONUNBUFFERED'] = '1'
os.environ['PYTEST_CACHE_DIR'] = '/dev/null'
# NOTE: Do NOT disable plugin autoload - pytest-html needs to auto-register
# os.environ['PYTEST_DISABLE_PLUGIN_AUTOLOAD'] = '1'  # Removed to allow pytest-html plugin
os.environ['PYTHONHASHSEED'] = '0'

# Additional cache prevention
import sys
sys.dont_write_bytecode = True

# Cache prevention is handled by environment variables and pytest configuration

def pytest_configure(config):
    """Configure pytest to disable cache plugin and clean cache folders."""
    # Remove cache plugin if it exists
    if hasattr(config, 'pluginmanager'):
        try:
            cache_plugin = config.pluginmanager.get_plugin('cache')
            if cache_plugin:
                config.pluginmanager.unregister(cache_plugin)
        except:
            pass
    
    # Clean cache folders recursively before running tests
    root_dir = os.path.dirname(os.path.dirname(__file__))
    cache_patterns = ['.pytest_cache', '__pycache__']
    
    def clean_cache_recursive(directory):
        """Recursively clean cache directories."""
        if not os.path.exists(directory):
            return
        try:
            for root, dirs, files in os.walk(directory):
                # Skip venv, node_modules, .git directories
                dirs[:] = [d for d in dirs if d not in ['venv', 'node_modules', '.git', '__pycache__', '.pytest_cache']]
                for cache_pattern in cache_patterns:
                    cache_path = os.path.join(root, cache_pattern)
                    if os.path.exists(cache_path):
                        try:
                            shutil.rmtree(cache_path)
                            print(f"🧹 Cleaned {cache_path}")
                        except:
                            pass
        except:
            pass
    
    # Clean from project root
    clean_cache_recursive(root_dir)
    
    # Also clean in current directory
    for cache_pattern in cache_patterns:
        cache_path = os.path.join(os.path.dirname(__file__), cache_pattern)
        if os.path.exists(cache_path):
            try:
                shutil.rmtree(cache_path)
                print(f"🧹 Cleaned {cache_path}")
            except:
                pass

def pytest_addoption(parser):
    """Add custom options."""
    parser.addoption("--cache-disable", action="store_true", default=True, 
                    help="Disable pytest cache completely")

def pytest_sessionstart(session):
    """Clean cache at session start."""
    root_dir = os.path.dirname(os.path.dirname(__file__))
    cache_patterns = ['.pytest_cache', '__pycache__']
    
    def clean_cache_recursive(directory):
        """Recursively clean cache directories."""
        if not os.path.exists(directory):
            return
        try:
            for root, dirs, files in os.walk(directory):
                # Skip venv, node_modules, .git directories
                dirs[:] = [d for d in dirs if d not in ['venv', 'node_modules', '.git', '__pycache__', '.pytest_cache']]
                for cache_pattern in cache_patterns:
                    cache_path = os.path.join(root, cache_pattern)
                    if os.path.exists(cache_path):
                        try:
                            shutil.rmtree(cache_path)
                        except:
                            pass
        except:
            pass
    
    # Clean from project root
    clean_cache_recursive(root_dir)


@pytest.fixture(scope="session")
def config():
    """Load test configuration."""
    # Check environment variable for headless mode
    headless_env = os.getenv("HEADLESS", "false").lower()
    headless = headless_env in ["true", "1", "yes"]
    
    config = {
        "browser_type": os.getenv("BROWSER_TYPE", "chromium"),
        "headless": headless,  # Respect environment variable
        "slow_mo": 1000,    # Add slow motion for better visibility
        "timeout": 30000
    }
    
    print(f"🔧 Test Configuration: headless={config['headless']}, browser={config['browser_type']}")
    print(f"🔧 Environment HEADLESS: {os.getenv('HEADLESS', 'not set')}")
    
    return config


@pytest.fixture(scope="session")
def logger():
    """Initialize logger for tests."""
    import logging
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    return logger


@pytest.fixture(scope="function")
def browser_context_args():
    """Browser context arguments."""
    # Ensure directories exist - use absolute paths to avoid issues
    import os
    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test-results')
    os.makedirs(os.path.join(base_dir, "videos"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "screenshots"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "logs"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "reports"), exist_ok=True)
    
    record_video = os.getenv("RECORD_VIDEO_ON_FAILURE", "true").lower() == "true"
    
    return {
        "viewport": {"width": 1280, "height": 720},
        "record_video_dir": os.path.join(base_dir, "videos/") if record_video else None,
        "record_video_size": {"width": 1280, "height": 720} if record_video else None,
    }


# Use pytest-playwright's built-in page fixture
# The page fixture will be provided by pytest-playwright plugin

@pytest.fixture(scope="function")
def page(config, browser_context_args):
    """Create a browser page for testing."""
    from playwright.sync_api import sync_playwright
    
    with sync_playwright() as p:
        browser_type = getattr(p, config['browser_type'])
        browser = browser_type.launch(
            headless=config['headless'],
            slow_mo=config['slow_mo']
        )
        context = browser.new_context(**browser_context_args)
        page_obj = context.new_page()
        
        yield page_obj
        
        context.close()
        browser.close()


@pytest.fixture(scope="function", autouse=True)
def failure_recording(request):
    """Record video and screenshots on test failure."""
    from datetime import datetime
    
    # Use absolute paths to avoid issues
    base_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'test-results')
    os.makedirs(os.path.join(base_dir, "screenshots"), exist_ok=True)
    os.makedirs(os.path.join(base_dir, "videos"), exist_ok=True)
    
    yield
    
    # Check if test failed
    test_failed = False
    if hasattr(request.node, 'rep_call'):
        test_failed = request.node.rep_call.failed
    
    if test_failed:
        print(f"\n❌ Test {test_name} FAILED - Capturing failure artifacts...")
        
        # Try to get page fixture if available
        try:
            page = request.getfixturevalue('page')
            
            # Take screenshot on failure
            try:
                screenshot_path = os.path.join(base_dir, "screenshots", f"failure_{test_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png")
                page.screenshot(path=screenshot_path, full_page=True)
                print(f"📸 Screenshot saved: {screenshot_path}")
            except Exception as e:
                print(f"⚠️  Failed to save screenshot: {e}")
            
            # Save video on failure (if video recording was enabled)
            if os.getenv("RECORD_VIDEO_ON_FAILURE", "true").lower() == "true":
                try:
                    video = page.video
                    if video:
                        video_path = os.path.join(base_dir, "videos", f"failure_{test_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.webm")
                        video.save_as(video_path)
                        print(f"🎥 Video saved: {video_path}")
                    else:
                        print("⚠️  No video available for this test")
                except Exception as e:
                    print(f"⚠️  Failed to save video: {e}")
        except Exception:
            print("⚠️  Page fixture not available for screenshot/video capture")
    else:
        # Discard video if test passed (to save space)
        try:
            page = request.getfixturevalue('page')
            if os.getenv("RECORD_VIDEO_ON_FAILURE", "true").lower() == "true":
                try:
                    video = page.video
                    if video:
                        video.discard()
                        print(f"✅ Test {test_name} PASSED - Video discarded")
                except Exception:
                    pass  # Video might not exist
        except Exception:
            pass  # Page fixture not available


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    """Hook to capture test results for screenshot on failure."""
    outcome = yield
    rep = outcome.get_result()
    setattr(item, "rep_" + rep.when, rep)
