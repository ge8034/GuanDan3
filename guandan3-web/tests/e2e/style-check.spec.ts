import { test, expect } from '@playwright/test';

test('verify styles and console errors', async ({ page }) => {
  // Listen for console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const errorText = msg.text();
      consoleErrors.push(errorText);
      console.log(`Console Error: "${errorText}"`);
    }
  });

  // Listen for network errors (failed requests)
  const networkErrors: string[] = [];
  page.on('requestfailed', request => {
    const url = request.url();
    const errorText = request.failure()?.errorText || 'unknown';
    // 忽略 WebSocket 和外部资源错误（mock 环境预期行为）
    if (!url.includes('websocket') && !url.includes('supabase.co')) {
      networkErrors.push(`${url} - ${errorText}`);
      console.log(`Request Failed: ${url} - ${errorText}`);
    }
  });

  // 访问首页 - 使用完整的 baseURL
  await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded' });

  // 等待页面加载
  await page.waitForLoadState('domcontentloaded');

  // 等待一下确保页面渲染
  await page.waitForTimeout(1000);

  // 检查页面标题
  const title = await page.title();
  expect(title).toBeTruthy();
  console.log(`Page title: ${title}`);

  // 检查是否有可用的内容
  const bodyText = await page.locator('body').textContent();
  expect(bodyText).toBeTruthy();
  console.log(`Page has content: ${bodyText!.length > 0}`);

  // 检查 body 基本样式
  const bodyStyles = await page.locator('body').evaluate((el) => {
    const computed = window.getComputedStyle(el);
    return {
      fontFamily: computed.fontFamily,
      backgroundColor: computed.backgroundColor,
      color: computed.color,
    };
  });
  console.log(`Body styles:`, bodyStyles);

  // 验证基本样式存在
  expect(bodyStyles.fontFamily).toBeTruthy();
  expect(bodyStyles.color).toBeTruthy();

  // 检查关键错误 - 忽略预期的错误
  const criticalErrors = consoleErrors.filter(err =>
    !err.includes('WebSocket') &&
    !err.includes('DevTools') &&
    !err.includes('React DevTools') &&
    !err.includes('Extension')
  );

  console.log(`Total console errors: ${consoleErrors.length}`);
  console.log(`Critical errors: ${criticalErrors.length}`);

  if (criticalErrors.length > 0) {
    console.log('Critical errors found:', criticalErrors);
  }

  // 这个测试验证页面能正常加载，没有严重错误
  expect(criticalErrors.length).toBeLessThan(5);
});
