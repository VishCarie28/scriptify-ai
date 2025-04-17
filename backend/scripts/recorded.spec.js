import { test, expect } from '@playwright/test';

// Grouping the tests under the suite name "Automation Practice Page"
test.describe("Automation Practice Page", () => {

  // Test for checking radio button
  test("should check Radio1 button", async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');
    const radioButton = page.locator('label').filter({ hasText: 'Radio1' }).getByRole('radio');
    await radioButton.check();
    expect(radioButton).toBeChecked();
  });

  // Test for selecting dropdown option
  test("should select option2 from dropdown", async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');
    const dropdown = page.locator('#dropdown-class-example');
    await dropdown.selectOption('option2');
    expect(dropdown).toHaveValue('option2');
  });

  // Test for checking checkbox
  test("should check checkBoxOption3", async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');
    const checkBox = page.locator('#checkBoxOption3');
    await checkBox.check();
    expect(checkBox).toBeChecked();
  });

  // Test for filling text in textbox
  test("should fill 'pvs' in the textbox", async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');
    const textbox = page.getByRole('textbox', { name: 'Enter Your Name' });
    await textbox.click();
    await textbox.fill('pvs');
    expect(textbox).toHaveValue('pvs');
  });

});