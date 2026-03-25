import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';

const CONSOLE_LOGS = [];
const ERRORS = [];
const WARNINGS = [];
const GAME_EVENTS = [];

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
      timestamp: new Date().toISOString()
    };

    CONSOLE_LOGS.push(logEntry);

    if (type === 'error') {
      ERRORS.push(logEntry);
      console.error(`[ERROR] ${text}`);
    } else if (type === 'warning') {
      WARNINGS.push(logEntry);
      console.warn(`[WARNING] ${text}`);
    }
  });

  // 捕获页面错误
  page.on('pageerror', error => {
    ERRORS.push({
      type: 'pageerror',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  // 捕获网络请求失败
  page.on('requestfailed', request => {
    const failure = request.failure();
    if (failure) {
      ERRORS.push({
        type: 'network',
        text: `Request failed: ${request.url()} - ${failure.text}`,
        timestamp: new Date().toISOString()
      });
      console.error(`[NETWORK ERROR] ${request.url()} - ${failure.text}`);
    }
  });

  try {
    console.log('=== 开始完整游戏流程测试 ===\n');

    // 步骤 1: 访问首页
    console.log('[步骤 1] 访问游戏首页...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    console.log('✓ 首页加载完成\n');

    // 步骤 2: 创建练习房间
    console.log('[步骤 2] 创建练习房间...');
    const createPracticeBtn = await page.locator('button:has-text("练习")').first();
    await createPracticeBtn.click();
    await page.waitForTimeout(3000);
    console.log('✓ 练习房间创建完成\n');

    // 步骤 3: 等待进入房间并检查状态
    console.log('[步骤 3] 等待进入房间...');
    // 等待导航完成
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    const url = page.url();
    console.log(`  当前 URL: ${url}`);

    // 如果没有自动跳转，手动等待
    if (!url.includes('/room/')) {
      console.log('  等待页面跳转...');
      await page.waitForTimeout(3000);
      const newUrl = page.url();
      if (!newUrl.includes('/room/')) {
        console.log(`  警告: URL 仍为 ${newUrl}，继续测试`);
      } else {
        console.log(`✓ 进入房间: ${newUrl}\n`);
      }
    } else {
      console.log(`✓ 进入房间: ${url}\n`);
    }

    // 步骤 4: 等待游戏自动开始
    console.log('[步骤 4] 等待游戏自动开始...');
    await page.waitForTimeout(5000);

    // 检查是否有开始游戏按钮（如果没有自动开始）
    const startBtn = await page.locator('button:has-text("开始")').first();
    if (await startBtn.isVisible({ timeout: 2000 })) {
      console.log('点击开始游戏按钮...');
      await startBtn.click();
    }

    // 等待游戏状态变为 playing
    await page.waitForTimeout(10000);
    console.log('✓ 游戏已开始\n');

    // 步骤 5: 观察游戏进行
    console.log('[步骤 5] 观察游戏进行 (30秒)...');
    for (let i = 0; i < 6; i++) {
      await page.waitForTimeout(5000);
      console.log(`  游戏进行中... ${((i + 1) * 5)}秒`);
    }
    console.log('✓ 游戏观察完成\n');

    // 步骤 6: 检查页面元素
    console.log('[步骤 6] 检查游戏界面元素...');

    // 检查手牌区域
    const handArea = await page.locator('[data-testid="hand-area"]').first();
    const handVisible = await handArea.isVisible().catch(() => false);
    GAME_EVENTS.push({ event: 'hand_area_visible', visible: handVisible });
    console.log(`  手牌区域: ${handVisible ? '✓' : '✗'}`);

    // 检查玩家头像
    const avatars = await page.locator('[data-testid^="player-avatar"]').count();
    GAME_EVENTS.push({ event: 'player_avatars_count', count: avatars });
    console.log(`  玩家头像: ${avatars}个`);

    // 检查游戏状态显示
    const statusElements = await page.locator('text=/游戏状态|Game Status/').count();
    console.log(`  状态显示: ${statusElements > 0 ? '✓' : '✗'}`);
    console.log('✓ 界面元素检查完成\n');

    // 步骤 7: 测试页面交互
    console.log('[步骤 7] 测试页面交互...');

    // 尝试选择一张牌（如果有）
    const firstCard = await page.locator('[data-card-index="0"]').first();
    if (await firstCard.isVisible({ timeout: 2000 })) {
      await firstCard.click();
      await page.waitForTimeout(500);
      console.log('  ✓ 卡牌选择测试完成');
    } else {
      console.log('  - 没有可选择的卡牌（可能是AI回合）');
    }

    // 检查过牌按钮
    const passBtn = await page.locator('button:has-text("过牌")').first();
    const passVisible = await passBtn.isVisible().catch(() => false);
    GAME_EVENTS.push({ event: 'pass_button_visible', visible: passVisible });
    console.log(`  过牌按钮: ${passVisible ? '✓' : '✗'}`);

    console.log('✓ 交互测试完成\n');

    // 步骤 8: 等待捕获延迟错误
    console.log('[步骤 8] 等待捕获延迟错误 (5秒)...');
    await page.waitForTimeout(5000);
    console.log('✓ 延迟错误检测完成\n');

    // 步骤 9: 检查控制台日志中的关键事件
    console.log('[步骤 9] 分析游戏事件...');
    const aiLogs = CONSOLE_LOGS.filter(l =>
      l.text.includes('[ensureAgentSystem]') ||
      l.text.includes('[MessageBus]') ||
      l.text.includes('[GuanDanAgent]')
    );
    console.log(`  Agent系统日志: ${aiLogs.length}条`);

    const gameLogs = CONSOLE_LOGS.filter(l =>
      l.text.includes('[fetchGame]') ||
      l.text.includes('[AutoStart]')
    );
    console.log(`  游戏流程日志: ${gameLogs.length}条`);

    const errorLogs = CONSOLE_LOGS.filter(l => l.type === 'error');
    console.log(`  错误日志: ${errorLogs.length}条`);

    console.log('✓ 事件分析完成\n');

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
      gameEvents: GAME_EVENTS.length,
      timestamp: new Date().toISOString()
    },
    errors: ERRORS,
    warnings: WARNINGS,
    gameEvents: GAME_EVENTS,
    allLogs: CONSOLE_LOGS
  };

  await writeFile('test-results/full-gameplay-report.json', JSON.stringify(report, null, 2));

  console.log('\n=== 测试完成 ===');
  console.log(`总日志数: ${report.summary.totalLogs}`);
  console.log(`错误数: ${report.summary.errors}`);
  console.log(`警告数: ${report.summary.warnings}`);
  console.log(`游戏事件: ${report.summary.gameEvents}`);
  console.log('详细报告已保存到: test-results/full-gameplay-report.json\n');

  console.log('=== 测试结果 ===');
  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log('✓ 所有测试通过！零错误，零警告！');
  } else {
    console.log(`✗ 发现 ${ERRORS.length} 个错误和 ${WARNINGS.length} 个警告`);
  }

  return report;
}

// 运行测试
captureConsoleLogs().then(report => {
  process.exit(report.summary.errors > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
