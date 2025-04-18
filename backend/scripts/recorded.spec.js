import { test, expect } from '@playwright/test';

test.describe('Automation Practice', () => {
  test('should interact with form elements correctly', async ({ page }) => {
    // Navigate to the test page
    await page.goto('https://rahulshettyacademy.com/AutomationPractice/');

    // Check the radio button labeled 'Radio1'
    await page.locator('label').filter({ hasText: 'Radio1' }).getByRole('radio').check();
    expect(await page.locator('label').filter({ hasText: 'Radio1' }).getByRole('radio')).toBeChecked();

    // Select 'option2' from the dropdown
    await page.locator('#dropdown-class-example').selectOption('option2');
    expect(await page.locator('#dropdown-class-example')).toHaveValue('option2');

    // Check the checkbox labeled 'Option3'
    await page.locator('#checkBoxOption3').check();
    expect(await page.locator('#checkBoxOption3')).toBeChecked();

    // Fill the 'Enter Your Name' textbox with 'vishal'
    const nameInput = page.getByRole('textbox', { name: 'Enter Your Name' });
    await nameInput.click();
    await nameInput.fill('vishal');
    expect(await nameInput).toHaveValue('vishal');

    // Click the 'Hide' button
    await page.getByRole('button', { name: 'Hide' }).click();
  });

  test('should open a new window', async ({ page }) => {
    // Prepare to wait for a popup event
    const page1Promise = page.waitForEvent('popup');

    // Click the 'Open Window' button
    await page.getByRole('button', { name: 'Open Window' }).click();

    // Wait for the popup event and verify that it occurred
    const page1 = await page1Promise;
    expect(page1).toBeDefined();
  });
});