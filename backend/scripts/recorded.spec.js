import { test, expect } from '@playwright/test';

test.describe('Automation Practice Tests', () => {

  test('should select radio button, dropdown and checkbox', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');

    // Select Radio button
    const radioButton = page.locator('label').filter({ hasText: 'Radio1' }).getByRole('radio');
    await radioButton.check();
    expect(radioButton).toBeChecked();

    // Select dropdown option
    const dropdown = page.locator('#dropdown-class-example');
    await dropdown.selectOption('option2');
    expect(dropdown).toHaveValue('option2');

    // Check checkbox
    const checkbox = page.locator('#checkBoxOption3');
    await checkbox.check();
    expect(checkbox).toBeChecked();
  });

  test('should handle alert and confirm dialogs', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');

    // Handle alert dialog
    page.once('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });
    await page.getByRole('button', { name: 'Alert' }).click();

    // Handle confirm dialog
    page.once('dialog', dialog => {
      console.log(`Dialog message: ${dialog.message()}`);
      dialog.dismiss().catch(() => {});
    });
    await page.getByRole('button', { name: 'Confirm' }).click();
  });

  test('should open new tabs and windows', async ({ page }) => {
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');

    // Open new tab
    const page1Promise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Open Tab' }).click();
    const page1 = await page1Promise;
    expect(await page1.title()).toBeDefined();

    // Open new window
    const page2Promise = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Open Window' }).click();
    const page2 = await page2Promise;
    expect(await page2.title()).toBeDefined();
  });
});