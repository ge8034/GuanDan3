/**
 * 游戏调试测试 - 捕获控制台日志和状态
 */

import { test } from '@playwright/test';

test('调试游戏页面 - 捕获所有状态', async ({ page }) => {
  const consoleLogs: string[] = [];
  const errors: string[] = [];

  // 监听所有控制台消息
  page.on('console', msg => {
    const log = `[${msg.type()}] ${msg.text()}`;
    consoleLogs.push(log);
  });

  // 监听所有错误
  page.on('pageerror', error => {
    errors.push(error.message);
    console.error('页面错误:', error.message);
  });

  // 监听网络请求和响应
  const requests: { url: string; method: string; status?: number }[] = [];
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      requests.push({ url: request.url(), method: request.method() });
    }
  });

  page.on('response', response => {
    const req = requests.find(r => r.url === response.url() && !r.status);
    if (req) {
      req.status = response.status();
    }
  });

  console.log('🚀 开始调试测试');

  // 访问首页
  console.log('📍 步骤1: 访问首页');
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // 获取页面标题
  const title = await page.title();
  console.log(`页面标题: ${title}`);

  // 查找练习/开始游戏按钮
  console.log('🔍 步骤2: 查找练习按钮');
  const buttons = await page.locator('button').all();
  console.log(`找到 ${buttons.length} 个按钮`);

  for (let i = 0; i < Math.min(buttons.length, 5); i++) {
    try {
      const text = await buttons[i].textContent();
      const isVisible = await buttons[i].isVisible();
      console.log(`  按钮${i}: "${text?.trim()}" - 可见:${isVisible}`);
    } catch (e) {
      // 忽略错误
    }
  }

  // 点击练习按钮
  const practiceBtn = page.getByRole('button', { name: /练习|开始/i }).first();
  await practiceBtn.click();
  await page.waitForTimeout(3000);

  // 获取当前URL
  const currentUrl = page.url();
  console.log(`当前URL: ${currentUrl}`);

  // 检查页面内容
  console.log('🔍 步骤3: 检查页面内容');

  // 列出所有主要元素
  const mainElements = await page.locator('main > *').all();
  console.log(`主区域有 ${mainElements.length} 个元素`);

  // 尝试查找游戏相关元素
  const gameSelectors = [
    '[data-testid="game-table"]',
    '.game-table',
    '#game-table',
    '[data-testid="room"]',
    '.room',
    '.card',
    '[data-card]'
  ];

  for (const selector of gameSelectors) {
    const count = await page.locator(selector).count();
    if (count > 0) {
      console.log(`✅ 找到 ${count} 个 "${selector}" 元素`);
    }
  }

  // 获取页面HTML片段
  const bodyText = await page.locator('body').textContent();
  console.log(`页面文本长度: ${bodyText?.length || 0}`);

  // 检查是否有错误消息
  if (bodyText && bodyText.includes('错误')) {
    console.log('⚠️ 页面包含错误信息');
  }

  // 等待一段时间观察状态变化
  console.log('⏳ 步骤4: 等待10秒观察状态');
  await page.waitForTimeout(10000);

  // 最终截图
  await page.screenshot({
    path: `test-results/debug-game-${Date.now()}.png`,
    fullPage: true
  });

  // 输出调试信息
  console.log('\n📊 调试信息汇总:');
  console.log(`- 控制台日志: ${consoleLogs.length} 条`);
  console.log(`- 错误: ${errors.length} 个`);
  console.log(`- API请求: ${requests.length} 个`);

  if (errors.length > 0) {
    console.log('\n❌ 错误列表:');
    errors.slice(0, 5).forEach(err => console.log(`  - ${err}`));
  }

  const failedRequests = requests.filter(r => r.status && r.status >= 400);
  if (failedRequests.length > 0) {
    console.log('\n❌ 失败的API请求:');
    failedRequests.forEach(req => {
      console.log(`  - ${req.method} ${req.url.split('?')[0]}: ${req.status}`);
    });
  }

  // 检查是否有gameState
  const gameState = await page.evaluate(() => {
    return (window as any).gameState || (window as any).useGameStore?.getState?.() || null;
  });

  if (gameState) {
    console.log('\n🎮 游戏状态:');
    console.log(JSON.stringify(gameState, null, 2));
  } else {
    console.log('\n⚠️ 未找到游戏状态对象');
  }
});
