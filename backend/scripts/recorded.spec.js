import { test, expect } from '@playwright/test';

test('should complete purchase flow on rahulshettyacademy', async ({ page, context }) => {
  // Step 0: Navigate to the start page
  await page.goto('https://rahulshettyacademy.com/loginpagePractise/', { waitUntil: 'networkidle' });

  // Step 1: Navigate to login page
  // Step 2: Fill in login details and submit
  await page.getByRole('textbox', { name: 'Username:' }).fill('rahulshettyacademy');
  await page.getByRole('textbox', { name: 'Password:' }).fill('learning');
  await page.getByRole('checkbox', { name: 'I Agree to the terms and' }).check();
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Assert successful login
  //expect(await page.locator('app-card')).toBeVisible();

  // Step 3: Add items to cart
  await page.locator('app-card').filter({ hasText: 'Blackberry $24.99 Lorem ipsum' }).getByRole('button').click();
  await page.locator('app-card').filter({ hasText: 'Nokia Edge $24.99 Lorem ipsum' }).getByRole('button').click();
  await page.locator('app-card').filter({ hasText: 'Samsung Note 8 $24.99 Lorem' }).getByRole('button').click();
  await page.locator('app-card').filter({ hasText: 'iphone X $24.99 Lorem ipsum' }).getByRole('button').click();

  // Assert items in cart
  expect(await page.getByText('Checkout ( 4 ) (current)')).toBeVisible();

  // Step 4: Proceed to checkout
  await page.getByText('Checkout ( 4 ) (current)').click();
  await page.getByRole('button', { name: 'Checkout' }).click();

  // Step 5: Fill in delivery details and agree to terms
  await page.getByRole('textbox', { name: 'Please choose your delivery' }).fill('Varanasi');
  await page.getByText('I agree with the term &').click();
  await page.getByRole('button', { name: 'Purchase' }).click();

  // Assert successful purchase
  expect(await page.getByText('× Success! Thank you! Your')).toBeVisible();

  // Step 6: Close success message and navigate back to home
  await page.getByText('× Success! Thank you! Your').click();
  await page.getByRole('link', { name: 'close' }).click();
  await page.getByRole('link', { name: 'ProtoCommerce Home' }).click();

  // Assert successful navigation back to home
  //expect(await page.getByRole('link', { name: 'ProtoCommerce Home' })).toBeVisible();
});

