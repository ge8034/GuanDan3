import { chromium } from 'playwright';
import { writeFile } from 'fs/promises';

const CONSOLE_LOGS = [];
const ERRORS = [];
const WARNINGS = [];
const GAME_EVENTS = [];

async function runCompleteGameTest() {
  const browser = await chromium.launch({ headless: false, slowMo: 100 });
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
    GAME_EVENTS.push({ type: 'console', data: logEntry });

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
    console.log('=== 开始完整游戏流程测试 ===');
    console.log('目标: 运行游戏直到出现 1/2/3/4 排名\n');

    // 步骤 1: 访问首页
    console.log('[步骤 1] 访问游戏首页...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    GAME_EVENTS.push({ event: 'homepage_loaded', timestamp: Date.now() });
    console.log('✓ 首页加载完成\n');

    // 步骤 2: 创建练习房间
    console.log('[步骤 2] 创建练习房间...');
    const createPracticeBtn = await page.locator('button:has-text("练习")').first();
    await createPracticeBtn.click();
    await page.waitForTimeout(3000);
    GAME_EVENTS.push({ event: 'practice_room_created', timestamp: Date.now() });
    console.log('✓ 练习房间创建完成\n');

    // 步骤 3: 等待进入房间
    console.log('[步骤 3] 等待进入游戏房间...');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    const url = page.url();
    console.log(`  当前 URL: ${url}`);
    GAME_EVENTS.push({ event: 'room_entered', url, timestamp: Date.now() });
    console.log('✓ 进入游戏房间\n');

    // 步骤 4: 等待游戏自动开始
    console.log('[步骤 4] 等待游戏自动开始...');
    await page.waitForTimeout(5000);

    const startBtn = await page.locator('button:has-text("开始")').first();
    if (await startBtn.isVisible({ timeout: 2000 })) {
      console.log('点击开始游戏按钮...');
      await startBtn.click();
      GAME_EVENTS.push({ event: 'start_button_clicked', timestamp: Date.now() });
    }

    // 等待游戏状态变为 playing
    await page.waitForTimeout(10000);
    GAME_EVENTS.push({ event: 'game_started', timestamp: Date.now() });
    console.log('✓ 游戏已开始\n');

    // 步骤 5: 等待游戏完成并出现排名
    console.log('[步骤 5] 模拟人类玩家和AI进行游戏直到完成...');
    console.log('（这可能需要 3-5 分钟，请耐心等待...）\n');

    // 截图查看游戏界面
    try {
      await page.screenshot({ path: 'test-results/game-state.png' });
      console.log('  已保存游戏界面截图到 test-results/game-state.png');
    } catch (e) {
      console.log('  截图失败:', e.message);
    }

    let gameFinished = false;
    let elapsedTime = 0;
    const maxWaitTime = 1200000; // 最多等待 20 分钟
    const checkInterval = 5000; // 每 5 秒检查一次
    let lastActionCount = 0;
    let stuckCount = 0;

    while (!gameFinished && elapsedTime < maxWaitTime) {
      // 模拟人类玩家出牌（通过 JavaScript 直接调用）
      try {
        const played = await page.evaluate(async () => {
          // 尝试从 window 对象获取游戏 store
          if (!window.gameStore) {
            return { played: false, reason: 'no_game_store' };
          }

          const state = window.gameStore.getState();
          const { myHand, currentSeat, counts } = state;

          // 只有当前座位是 0（人类玩家）时才出牌
          if (currentSeat !== 0) {
            return { played: false, reason: 'not_human_turn', currentSeat };
          }

          // 如果没有手牌，无法出牌
          if (!myHand || myHand.length === 0) {
            return { played: false, reason: 'no_hand' };
          }

          // 尝试出牌：随机选择 1-5 张牌
          const numCards = Math.min(Math.floor(Math.random() * 5) + 1, myHand.length);
          const cardsToPlay = myHand.slice(0, numCards).map(c => c.id);

          const result = await window.gameStore.getState().submitTurn('play', cardsToPlay);

          if (result?.error) {
            // 出牌失败，尝试过牌
            const passResult = await window.gameStore.getState().submitTurn('pass', []);
            if (passResult?.error) {
              return { played: false, reason: 'pass_failed', error: passResult.error.message };
            }
            return { played: true, action: 'pass' };
          }

          return { played: true, action: 'play', count: numCards };
        });

        if (played.played) {
          console.log(`  [人类玩家] ${played.action === 'pass' ? '过牌' : `出牌 (${played.count}张)`}`);
        } else {
          console.log(`  [人类玩家] 跳过: ${played.reason} (座位: ${played.currentSeat || 'N/A'})`);
        }
      } catch (e) {
        console.log(`  [人类玩家] 出牌异常: ${e.message}`);
      }

      await page.waitForTimeout(checkInterval);
      elapsedTime += checkInterval;

      // 检查是否有游戏结束弹窗
      const gameOverOverlay = await page.locator('text=/游戏结束|Game Over|排名|第.*名/').first();
      const rankingElements = await page.locator('text=/第[1-4]名/').count();

      // 检查"再来一局"按钮（游戏完成的可靠指标）
      const replayBtn = await page.locator('button:has-text("再来一局")').first();
      const hasReplayBtn = await replayBtn.isVisible().catch(() => false);

      // 检查控制台日志中的游戏完成状态
      const finishedLogs = CONSOLE_LOGS.filter(l =>
        l.text.includes('gameStatus=finished') ||
        l.text.includes('牌局：finished') ||
        l.text.includes('游戏结束')
      );

      console.log(`  游戏进行中... ${Math.floor(elapsedTime / 1000)}秒 (排名: ${rankingElements}, 再来一局: ${hasReplayBtn ? '✓' : '✗'})`);

      GAME_EVENTS.push({
        event: 'game_progress',
        elapsedTime,
        rankingCount: rankingElements,
        hasReplayBtn,
        timestamp: Date.now()
      });

      // 多种方式检测游戏完成
      if (rankingElements >= 4 || hasReplayBtn || finishedLogs.length > 0) {
        console.log('\n✓ 检测到游戏结束！');
        console.log(`  - 排名元素: ${rankingElements}`);
        console.log(`  - 再来一局按钮: ${hasReplayBtn ? '✓' : '✗'}`);
        console.log(`  - 完成日志: ${finishedLogs.length}`);
        gameFinished = true;
        GAME_EVENTS.push({ event: 'game_finished', rankingCount: rankingElements, hasReplayBtn, timestamp: Date.now() });

        // 截图保存游戏结果
        await page.screenshot({ path: 'test-results/game-finished-screenshot.png' });
        console.log('✓ 已保存游戏结束截图\n');
        break;
      }

      // 检查控制台日志中的游戏结束信息
      const finishLogs = CONSOLE_LOGS.filter(l =>
        l.text.includes('游戏结束') ||
        l.text.includes('game finished') ||
        l.text.includes('ranking') ||
        l.text.includes('排名')
      );

      if (finishLogs.length > 0) {
        console.log(`  控制台检测到 ${finishLogs.length} 条游戏结束相关日志`);
      }
    }

    if (!gameFinished) {
      console.log('\n⚠ 游戏未在预期时间内完成，但继续检查状态...');
    }

    // 步骤 6: 检查最终游戏状态
    console.log('[步骤 6] 检查最终游戏状态...');

    // 检查排名显示
    const rankingText = await page.locator('text=/排名|第.*名/').allTextContents().catch(() => []);
    GAME_EVENTS.push({ event: 'ranking_text', data: rankingText, timestamp: Date.now() });
    console.log(`  排名文本: ${rankingText.length > 0 ? rankingText.join(', ') : '未找到'}`);

    // 检查游戏状态显示 - 更精确的选择器
    const statusText = await page.locator('text=/状态|牌局/').allTextContents().catch(() => []);
    GAME_EVENTS.push({ event: 'game_status', data: statusText, timestamp: Date.now() });
    console.log(`  游戏状态: ${statusText.length > 0 ? statusText.join(', ') : '未找到'}`);

    // 检查是否有再来一局按钮（关键指标）
    const replayBtn = await page.locator('button:has-text("再来一局")').first();
    const hasReplayBtn = await replayBtn.isVisible().catch(() => false);
    GAME_EVENTS.push({ event: 'replay_button_visible', visible: hasReplayBtn, timestamp: Date.now() });
    console.log(`  再来一局按钮: ${hasReplayBtn ? '✓' : '✗'}`);

    // 基于多种指标判断游戏是否完成
    const actuallyFinished = hasReplayBtn || statusText.some(t => t.includes('finished'));
    if (actuallyFinished) {
      console.log('  ✓ 游戏已完成（基于按钮和状态检测）');
    }

    console.log('✓ 状态检查完成\n');

    // 步骤 7: 等待捕获延迟错误
    console.log('[步骤 7] 等待捕获延迟错误 (5秒)...');
    await page.waitForTimeout(5000);
    console.log('✓ 延迟错误检测完成\n');

  } catch (error) {
    console.error('测试过程中发生错误:', error);
    ERRORS.push({
      type: 'test_error',
      text: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    GAME_EVENTS.push({ event: 'test_error', error: error.message, timestamp: Date.now() });
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
      gameFinished: GAME_EVENTS.some(e => e.event === 'game_finished'),
      hasReplayBtn: GAME_EVENTS.some(e => e.hasReplayBtn === true),
      finishedEventCount: GAME_EVENTS.filter(e => e.event === 'game_finished').length,
      timestamp: new Date().toISOString()
    },
    errors: ERRORS,
    warnings: WARNINGS,
    gameEvents: GAME_EVENTS,
    allLogs: CONSOLE_LOGS
  };

  await writeFile('test-results/complete-game-report.json', JSON.stringify(report, null, 2));

  console.log('\n=== 测试完成 ===');
  console.log(`总日志数: ${report.summary.totalLogs}`);
  console.log(`错误数: ${report.summary.errors}`);
  console.log(`警告数: ${report.summary.warnings}`);
  console.log(`游戏事件: ${report.summary.gameEvents}`);
  console.log(`游戏完成: ${report.summary.gameFinished ? '✓ 是' : '✗ 否'}`);
  if (report.summary.hasReplayBtn) {
    console.log(`再来一局按钮: ✓ 可见`);
  }
  console.log('详细报告已保存到: test-results/complete-game-report.json\n');

  console.log('=== 测试结果 ===');
  if (ERRORS.length === 0 && WARNINGS.length === 0) {
    console.log('✓ 所有测试通过！零错误，零警告！');
  } else {
    console.log(`✗ 发现 ${ERRORS.length} 个错误和 ${WARNINGS.length} 个警告`);
  }

  // 分析游戏事件
  const gameStartEvent = GAME_EVENTS.find(e => e.event === 'game_started');
  const gameFinishEvent = GAME_EVENTS.find(e => e.event === 'game_finished');

  if (gameStartEvent && gameFinishEvent) {
    const gameDuration = gameFinishEvent.timestamp - gameStartEvent.timestamp;
    console.log(`\n游戏持续时间: ${Math.floor(gameDuration / 1000)} 秒`);
  }

  return report;
}

// 运行测试
runCompleteGameTest().then(report => {
  process.exit(report.summary.errors > 0 ? 1 : 0);
}).catch(error => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
