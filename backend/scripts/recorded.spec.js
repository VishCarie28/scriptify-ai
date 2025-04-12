import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://rahulshettyacademy.com/AutomationPractice/');
  await page.getByText('Radio1').click();
  await page.locator('label').filter({ hasText: 'Radio1' }).getByRole('radio').check();
  await page.locator('#dropdown-class-example').selectOption('option2');
  await page.locator('#checkbox-example').getByText('Option3').click();
  await page.locator('#checkBoxOption3').check();
});