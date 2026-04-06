/**
 * 捕获并分析控制台日志
 */

import { test } from '@playwright/test';

test('捕获控制台日志 - 诊断400错误', async ({ page }) => {
  const detailedLogs: string[] = [];

  page.on('console', async msg => {
    const args = msg.args();
    const values = await Promise.all(args.map(arg => arg.jsonValue()));
    detailedLogs.push(`[${msg.type()}] ${msg.text()} ${JSON.stringify(values).slice(0, 200)}`);
  });

  page.on('requestfinished', async request => {
    const response = await request.response();
    if (request.url().includes('games') && response && response.status() === 400) {
      const responseBody = await response.text();
      detailedLogs.push(`[400-ERROR] URL: ${request.url()}`);
      detailedLogs.push(`[400-ERROR] Body: ${responseBody}`);
    }
  });

  // 访问首页并创建练习房间
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  const practiceBtn = page.getByRole('button', { name: /开始练习/i }).first();
  await practiceBtn.click();

  // 等待房间加载
  await page.waitForTimeout(5000);

  // 输出所有日志
  console.log('\n📋 详细控制台日志:');
  detailedLogs.forEach(log => console.log(log));

  // 保存日志到文件
  const fs = require('fs');
  const logPath = 'test-results/console-debug.log';
  fs.writeFileSync(logPath, detailedLogs.join('\n'));
  console.log(`\n💾 日志已保存到: ${logPath}`);
});
