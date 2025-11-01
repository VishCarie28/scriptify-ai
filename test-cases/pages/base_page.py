from playwright.sync_api import Page
from utils.config_manager import ConfigManager


class BasePage:
    def __init__(self, page: Page):
        self.page = page
        self.config = ConfigManager.get_config()

    def navigate(self, url: str):
        full_url = self.config["base_url"] + url if url else self.config["base_url"]
        self.page.goto(full_url)
