from playwright.sync_api import Page, expect
from pages.base_page import BasePage


class CheckoutPage(BasePage):
    def __init__(self, page: Page):
        super().__init__(page)

    def navigate(self, url: str = ""):
        super().navigate(url)

    def checkout(self, first_name: str, last_name: str, postal_code: str):
        self.page.locator('[data-test="firstName"]').fill(first_name)
        self.page.locator('[data-test="lastName"]').fill(last_name)
        self.page.locator('[data-test="postalCode"]').fill(postal_code)
        self.page.locator('[data-test="continue"]').click()

    def finish_checkout(self):
        self.page.locator('[data-test="finish"]').click()

    def back_to_products(self):
        self.page.locator('[data-test="back-to-products"]').click()
