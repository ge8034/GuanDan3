import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';

const CONSOLE_LOGS = [];
const ERRORS = [];
const WARNINGS = [];

async function captureConsoleLogs() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // 捕获所有控制台消息
  page.on('console', async msg => {
    const type = msg.type();
    const text = msg.text();
    const location = msg.location();

    const logEntry = {
      type,
      text,
      url: location?.url,
      line: location?.lineNumber,
      column: location?.columnNumber,
      timestamp: new Date().toISOString()
    };

    CONSOLE_LOGS.push(logEntry);

    if (type === 'error') {
      ERRORS.push(logEntry);
      console.error(`[ERROR] ${text}`);
    } else if (type === 'warning') {
      WARNINGS.push(logEntry);
      console.warn(`[WARNING] ${text}`);
    } else {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  // 捕获页面错误
  page.on('pageerror', error => {
    const errorEntry = {
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    ERRORS.push(errorEntry);
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  // 捕获网络请求失败
  page.on('requestfailed', request => {
    const failure = request.failure();
    if (failure) {
      const errorEntry = {
        type: 'network',
        text: `Request failed: ${request.url()} - ${failure.text}`,
        timestamp: new Date().toISOString()
      };
      ERRORS.push(errorEntry);
      console.error(`[NETWORK ERROR] ${request.url()} - ${failure.text}`);
    }
  });

  try {
    console.log('正在访问游戏页面...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    console.log('页面加载完成');

    // 等待 5 秒让页面完全初始化
    await page.waitForTimeout(5000);

    // 检查是否有创建练习房间的按钮
    const createPracticeBtn = await page.locator('button:has-text("练习")').first();
    if (await createPracticeBtn.isVisible()) {
      console.log('找到练习房间按钮，点击创建...');

      // 点击创建练习房间
      await createPracticeBtn.click();
      await page.waitForTimeout(3000);

      // 检查是否进入游戏房间
      const url = page.url();
      console.log('当前 URL:', url);

      if (url.includes('/room/')) {
        console.log('成功进入游戏房间');
        await page.waitForTimeout(5000);

        // 尝试点击开始游戏按钮
        const startBtn = await page.locator('button:has-text("开始")').first();
        if (await startBtn.isVisible({ timeout: 2000 })) {
          console.log('找到开始游戏按钮，点击开始...');
          await startBtn.click();
          await page.waitForTimeout(5000);

          console.log('游戏应该已开始，等待 AI 回合...');
          // 等待游戏进行
          await page.waitForTimeout(15000);
        }
      }
    }

    // 再等待一段时间以捕获任何延迟的错误
    console.log('等待捕获延迟错误...');
    await page.waitForTimeout(5000);

  } catch (error) {
    console.error('测试过程中发生错误:', error);
    ERRORS.push({
      type: 'test_error',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  } finally {
    await browser.close();
  }

  // 生成报告
  const report = {
    summary: {
      totalLogs: CONSOLE_LOGS.length,
      errors: ERRORS.length,
      warnings: WARNINGS.length,
      timestamp: new Date().toISOString()
    },
    errors: ERRORS,
    warnings: WARNINGS,
    allLogs: CONSOLE_LOGS.slice(-100) // 最后 100 条日志
  };

  await writeFile('test-results/console-capture-report.json', JSON.stringify(report, null, 2));
  console.log('\n=== 测试报告 ===');
  console.log(`总日志数: ${report.summary.totalLogs}`);
  console.log(`错误数: ${report.summary.errors}`);
  console.log(`警告数: ${report.summary.warnings}`);
  console.log('详细报告已保存到: test-results/console-capture-report.json');

  return report;
}

// 运行测试
captureConsoleLogs().then(report => {
  process.exit(report.summary.errors > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
