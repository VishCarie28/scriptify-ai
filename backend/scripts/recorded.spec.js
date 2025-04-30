import { test, expect } from '@playwright/test';

test('should complete login flow on rahulshettyacademy', async ({ page, context }) => {
  // Step 0: Navigate to the start page
  await page.goto('https://rahulshettyacademy.com/locatorspractice/', { waitUntil: 'networkidle' });
  // Step 1: Navigate to login page
  // Step 2: Fill in the username
  const usernameLocator = page.locator('input[name="Username"]');
  await usernameLocator.click();
  await usernameLocator.fill('vishal');
  expect(usernameLocator.inputValue()).toBe('vishal');

  // Step 3: Fill in the password
  const passwordLocator = page.locator('input[name="Password"]');
  await passwordLocator.click();
  await passwordLocator.fill('singh');
  expect(passwordLocator.inputValue()).toBe('singh');

  // Step 4: Check "Remember my username" option
  const rememberUsernameLocator = page.locator('input[name="Remember my username"]');
  await rememberUsernameLocator.check();
  expect(rememberUsernameLocator.isChecked()).toBe(true);

  // Step 5: Agree to the terms
  const agreeTermsLocator = page.locator('input[name="I agree to the terms and"]');
  await agreeTermsLocator.check();
  expect(agreeTermsLocator.isChecked()).toBe(true);

  // Step 6: Submit the form
  const signInButtonLocator = page.locator('button[name="Sign In"]');
  await signInButtonLocator.click();

  // Add any necessary assertions here to validate successful form submission
});

