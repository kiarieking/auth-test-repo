/**
 * Positive Login Test
 * Site: https://practicetestautomation.com/practice-test-login/
 *
 * Test case 1: Positive LogIn test
 * 1. Open page
 * 2. Type username "student" into Username field
 * 3. Type password "Password123" into Password field
 * 4. Push Submit button
 * 5. Verify new page URL contains "practicetestautomation.com/logged-in-successfully/"
 * 6. Verify new page contains expected text ("Congratulations" or "successfully logged in")
 * 7. Verify button "Log out" is displayed on the new page
 *
 * Run with:
 *   npm init playwright@latest   (one-time setup)
 *   npx playwright test login.positive.spec.ts
 */

import 'dotenv/config';
import { test, expect } from '@playwright/test';
// import process from 'process';

const LOGIN_URL = process.env.LOGIN_URL 
const VALID_PASSWORD = process.env.PASSWORD
const VALID_USERNAME = process.env.USERNAME
const EXPECTED_URL_FRAGMENT = 'practicetestautomation.com/logged-in-successfully/';

test.describe('Login - positive scenarios', () => {
  test('successful login with valid credentials', async ({ page }) => {
    // 1. Open page
    await page.goto(LOGIN_URL);

    // 2. Type username into Username field
    await page.locator('#username').fill(VALID_USERNAME);

    // 3. Type password into Password field
    await page.locator('#password').fill(VALID_PASSWORD);

    // 4. Push Submit button
    await page.locator('#submit').click();

    // 5. Verify new page URL contains the expected fragment
    await expect(page).toHaveURL(new RegExp(EXPECTED_URL_FRAGMENT.replace(/\./g, '\\.')));

    // 6. Verify new page contains expected text
    await expect(page.locator('h1')).toContainText('Logged In Successfully');
    await expect(page.locator('.post-content')).toContainText('You successfully logged in');

    // 7. Verify "Log out" button is displayed
    await expect(page.getByRole('link', { name: 'Log out' })).toBeVisible();
  });

  test('failed login with invalid credentials', async ({ page }) => {
    await page.goto(LOGIN_URL)

    await page.locator('#username').fill('invalid username')

    await page.locator('#password').fill(VALID_PASSWORD)

    await page.locator('#submit').click()

    await expect(page.locator('#error')).toHaveText('Your username is invalid!')
  
  });
})