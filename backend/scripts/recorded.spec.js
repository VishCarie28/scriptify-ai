import { test, expect } from '@playwright/test';

// Grouping related test cases under a describe block
test.describe('Automation Practice Tests', () => {

  // Test case for checking the radio button
  test('should check the radio button', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');
    const radioButton = page.locator('input[type="radio"][value="radio1"]');
    await radioButton.check();
    // Assertion to verify if the radio button is checked
    await expect(radioButton).toBeChecked();
  });

  // Test case for selecting an option from the dropdown
  test('should select an option from the dropdown', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');
    const dropdown = page.locator('#dropdown-class-example');
    await dropdown.selectOption('option1');
    // Assertion to verify the selected value using inputValue()
    await expect(dropdown).toHaveValue('option1');
  });

  // Test case for checking a checkbox
  test('should check the checkbox', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');
    const checkbox = page.locator('#checkBoxOption3');
    await checkbox.check();
    // Assertion to verify if the checkbox is checked
    await expect(checkbox).toBeChecked();
  });

});
