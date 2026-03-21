import { test, expect } from '@playwright/test';

test('verify styles and console errors', async ({ page }) => {
  // Listen for console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Console Error: "${msg.text()}"`);
    }
  });

  // Listen for network errors (failed requests)
  page.on('requestfailed', request => {
    console.log(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  await page.goto('http://localhost:3000/design-system');

  // Check if h1 is visible
  const header = page.locator('h1').filter({ hasText: '富春山居图设计系统' });
  await expect(header).toBeVisible({ timeout: 10000 });

  // Check computed style for color
  const color = await header.evaluate((el) => {
    return window.getComputedStyle(el).color;
  });
  console.log(`Header color: ${color}`);
  
  // Verify it matches the expected color #1A4A0A -> rgb(26, 74, 10)
  expect(color).toBe('rgb(26, 74, 10)');

  // Check font family on body
  const fontFamily = await page.locator('body').evaluate((el) => {
    return window.getComputedStyle(el).fontFamily;
  });
  console.log(`Body font family: ${fontFamily}`);
  expect(fontFamily).toMatch(/Noto Serif SC|Source Han Serif SC/);
});
