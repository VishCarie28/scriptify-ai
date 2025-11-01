from playwright.sync_api import Page, expect
from pages.base_page import BasePage


class HomePage(BasePage):
    def __init__(self, page: Page):
        super().__init__(page)

    def navigate(self, url: str = ""):
        super().navigate(url)

    def add_to_cart(self, product: str):
        self.page.locator(f'[data-test="add-to-cart-{product}"]').click()

    def open_cart(self):
        self.page.locator('[data-test="shopping-cart-link"]').click()

    def open_menu(self):
        self.page.get_by_role("button", name="Open Menu").click()

    def close_menu(self):
        self.page.get_by_role("button", name="Close Menu").click()

    def logout(self):
        self.page.locator('[data-test="logout-sidebar-link"]').click()
