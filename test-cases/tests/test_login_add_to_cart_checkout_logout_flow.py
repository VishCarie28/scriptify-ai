import pytest
from playwright.sync_api import Page, expect
from pages.login_page import LoginPage
from pages.home_page import HomePage
from pages.checkout_page import CheckoutPage


def test_login_add_to_cart_checkout_logout_flow(page: Page):
    login_page = LoginPage(page)
    login_page.navigate("")
    login_page.login("standard_user", "secret_sauce")
    home_page = HomePage(page)
    products = [
        "sauce-labs-backpack",
        "sauce-labs-bike-light",
        "sauce-labs-bolt-t-shirt",
        "sauce-labs-fleece-jacket",
        "sauce-labs-onesie",
        "test.allthethings()-t-shirt-(red)",
    ]
    for product in products:
        home_page.add_to_cart(product)
    home_page.open_cart()
    home_page.navigate("checkout-step-one.html")
    checkout_page = CheckoutPage(page)
    checkout_page.checkout("Vishal", "Singh", "221003")
    checkout_page.finish_checkout()
    checkout_page.back_to_products()
    home_page.open_menu()
    home_page.close_menu()
    home_page.open_menu()
    home_page.logout()
    # Assertions verify outcomes: page transitions, success messages, etc.
    expect(
        page.locator('[data-test="login-button"]')
    ).to_be_visible()  # Verify successful logout
