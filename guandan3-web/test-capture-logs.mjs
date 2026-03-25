/**
 * 捕获游戏控制台日志
 * 专注收集所有错误和警告
 */

import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';

const LOGS = {
  errors: [],
  warnings: [],
  info: [],
  pageErrors: [],
  networkErrors: [],
  timestamps: []
};

function addLog(type, data) {
  const entry = { ...data, timestamp: new Date().toISOString() };
  LOGS.timestamps.push(entry.timestamp);

  switch(type) {
    case 'error':
      LOGS.errors.push(entry);
      console.error(`[ERROR] ${data.message || data.text}`);
      break;
    case 'warning':
      LOGS.warnings.push(entry);
      console.warn(`[WARN] ${data.message || data.text}`);
      break;
    case 'pageError':
      LOGS.pageErrors.push(entry);
      console.error(`[PAGE ERROR] ${data.message}`);
      break;
    case 'networkError':
      LOGS.networkErrors.push(entry);
      console.error(`[NET ERROR] ${data.url} - ${data.error}`);
      break;
    default:
      LOGS.info.push(entry);
      console.log(`[INFO] ${data.message || data.text}`);
  }
}

async function captureLogs() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 50
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  // 捕获控制台消息
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    if (type === 'error') {
      addLog('error', { text, url: location?.url, line: location?.lineNumber });
    } else if (type === 'warning') {
      addLog('warning', { text, url: location?.url, line: location?.lineNumber });
    } else if (text.includes('ERROR') || text.includes('错误')) {
      // 排除正常的调试日志
      if (!text.includes('[fetchGame]') && !text.includes('gameError: null')) {
        addLog('error', { text, url: location?.url, line: location?.lineNumber });
      }
    }
  });

  // 捕获页面错误
  page.on('pageerror', error => {
    addLog('pageError', { message: error.message, stack: error.stack });
  });

  // 捕获网络错误
  page.on('requestfailed', request => {
    const failure = request.failure();
    if (failure && failure.text !== 'net::ERR_ABORTED') {
      addLog('networkError', { url: request.url(), error: failure.text });
    }
  });

  // 捕获 400+ 响应
  page.on('response', response => {
    if (response.status() >= 400) {
      addLog('networkError', { url: response.url(), error: `HTTP ${response.status()}` });
    }
  });

  try {
    console.log('=== 开始捕获游戏日志 ===\n');

    // 访问首页
    console.log('[1/5] 访问首页...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);

    // 点击练习按钮
    console.log('[2/5] 进入练习房间...');
    const practiceBtn = page.locator('[data-testid="home-practice"]').first();
    if (await practiceBtn.isVisible({ timeout: 5000 })) {
      await practiceBtn.click();
      await page.waitForTimeout(5000);
    }

    // 等待游戏加载
    console.log('[3/5] 等待游戏加载...');
    await page.waitForTimeout(5000);

    // 检查开始按钮
    const startBtn = page.locator('button:has-text("开始")').first();
    if (await startBtn.isVisible({ timeout: 3000 })) {
      console.log('[4/5] 点击开始按钮...');
      await startBtn.click();
      await page.waitForTimeout(5000);
    } else {
      console.log('[4/5] 游戏可能已自动开始');
    }

    // 观察游戏运行 30 秒
    console.log('[5/5] 观察游戏运行（30秒）...');
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(5000);
      console.log(`  观察 ${i + 1}/6...`);
    }

    // 最终截图
    await page.screenshot({ path: 'test-results/game-state-capture.png' });
    console.log('\n截图已保存');

  } finally {
    await browser.close();
  }

  // 生成报告
  const report = {
    summary: {
      totalErrors: LOGS.errors.length,
      totalWarnings: LOGS.warnings.length,
      totalPageErrors: LOGS.pageErrors.length,
      totalNetworkErrors: LOGS.networkErrors.length,
      totalIssues: LOGS.errors.length + LOGS.warnings.length + LOGS.pageErrors.length + LOGS.networkErrors.length,
      timestamp: new Date().toISOString()
    },
    errors: LOGS.errors,
    warnings: LOGS.warnings,
    pageErrors: LOGS.pageErrors,
    networkErrors: LOGS.networkErrors
  };

  await writeFile('test-results/captured-logs.json', JSON.stringify(report, null, 2));

  console.log('\n=== 日志捕获完成 ===');
  console.log(`错误: ${report.summary.totalErrors}`);
  console.log(`警告: ${report.summary.totalWarnings}`);
  console.log(`页面错误: ${report.summary.totalPageErrors}`);
  console.log(`网络错误: ${report.summary.totalNetworkErrors}`);
  console.log(`总问题数: ${report.summary.totalIssues}`);
  console.log('\n详细报告: test-results/captured-logs.json');

  if (report.summary.totalIssues > 0) {
    console.log('\n=== 问题摘要 ===');
    [...LOGS.errors, ...LOGS.pageErrors].forEach((err, i) => {
      console.log(`${i + 1}. ${err.text || err.message}`);
    });
  }

  return report;
}

captureLogs().then(report => {
  process.exit(report.summary.totalIssues > 0 ? 1 : 0);
}).catch(err => {
  console.error('测试失败:', err);
  process.exit(1);
});
