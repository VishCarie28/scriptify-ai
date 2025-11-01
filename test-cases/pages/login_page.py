from playwright.sync_api import Page, expect
from pages.base_page import BasePage


class LoginPage(BasePage):
    def __init__(self, page: Page):
        super().__init__(page)

    def navigate(self, url: str = ""):
        super().navigate(url)

    def login(self, username: str, password: str):
        # Playwright's auto-wait handles element visibility
        self.page.locator('[data-test="username"]').fill(username)
        self.page.locator('[data-test="password"]').fill(password)
        self.page.locator('[data-test="login-button"]').click()
