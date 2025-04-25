import { test, expect } from '@playwright/test';

test('should complete purchase flow at Rahul Shetty Academy', async ({ page, context }) => {
  // Step 0: Navigate to the start page
  await page.goto('https://rahulshettyacademy.com/loginpagePractise/', { waitUntil: 'networkidle' });
  // Step 1: Navigate to login page
  // Step 2: Fill in login details and sign in
  const usernameLocator = page.getByRole('textbox', { name: 'Username:' });
  const passwordLocator = page.getByRole('textbox', { name: 'Password:' });
  await usernameLocator.click();
  await usernameLocator.fill('rahulshettyacademy');
  await passwordLocator.click();
  await passwordLocator.fill('learning');
  await page.getByRole('checkbox', { name: 'I Agree to the terms and' }).check();
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Assertion: Verify successful login
  expect(page.locator('app-card').nth(0)).toBeVisible();

  // Step 3: Select products and proceed to checkout
  const productLocator = (productText) => page.locator('app-card').filter({ hasText: productText }).getByRole('button');
  await productLocator('iphone X $24.99 Lorem ipsum').click();
  await productLocator('Samsung Note 8 $24.99 Lorem').click();
  await productLocator('Nokia Edge $24.99 Lorem ipsum').click();
  await productLocator('Blackberry $24.99 Lorem ipsum').click();
  await page.getByText('Checkout ( 4 ) (current)').click();
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Step 4: Fill in delivery details and confirm purchase
  const deliveryLocator = page.getByRole('textbox', { name: 'Please choose your delivery' });
  await deliveryLocator.click();
  await deliveryLocator.fill('Varanasi');
  await page.getByText('I agree with the term &').click();
  await page.getByRole('button', { name: 'Purchase' }).click();

  // Assertion: Verify successful purchase
  expect(page.getByText('× Success! Thank you! Your')).toBeVisible();

  // Step 5: Close the success message
  await page.getByRole('link', { name: 'close' }).click();
});

