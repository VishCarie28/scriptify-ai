import { test, expect } from '@playwright/test';

test('should click on the "Smooth project time tracking" link', async ({ page }) => {
  // Navigate to the specified URL
  await page.goto('https://www.keka.com/us/');

  // Locate the "Smooth project time tracking" link using text-based locator
  const smoothProjectLink = page.getByText('Smooth project time tracking', { exact: true });

  // Click on the link and wait for navigation
  await smoothProjectLink.click();

  // Validate that the navigation has occurred, e.g., by checking the new URL
  // Note: Assertions for the new page are omitted as per instructions
});
