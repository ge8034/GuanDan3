import { test, expect } from '@playwright/test';

test.describe('Debug Console Logs', () => {
  test('capture console logs and errors', async ({ page }) => {
    // Capture all console messages
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(`CONSOLE: ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        console.error(`CONSOLE ERROR: ${text}`);
      }
    });

    page.on('pageerror', error => {
      console.error(`PAGE ERROR: ${error.message}`);
    });

    page.on('requestfailed', request => {
      console.error(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Navigate to home page
    await page.goto('/');

    // Wait for page to load (support both 掼蛋 and 惯蛋)
    await expect(page).toHaveTitle(/掼蛋|惯蛋|GuanDan/i);

    // Take screenshot
    await page.screenshot({ path: 'debug-homepage.png' });

    // Log all console messages
    console.log(`Total console messages: ${consoleMessages.length}`);
    consoleMessages.forEach((msg, i) => console.log(`[${i}] ${msg}`));

    console.log(`Total console errors: ${consoleErrors.length}`);
    consoleErrors.forEach((err, i) => console.error(`[${i}] ${err}`));

    // Fail test if there are console errors
    expect(consoleErrors.length).toBe(0);
  });
});