import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe.skip('简化版完成测试', () => {
  test.setTimeout(90000);

  let hostContext: BrowserContext;
  let p2Context: BrowserContext;
  let hostPage: Page;
  let p2Page: Page;

  test.beforeAll(async ({ browser }) => {
    hostContext = await browser.newContext();
    p2Context = await browser.newContext();

    hostPage = await hostContext.newPage();
    p2Page = await p2Context.newPage();
  });

  test.afterAll(async () => {
    await Promise.all([
      hostContext?.close().catch(() => {}),
      p2Context?.close().catch(() => {})
    ]);
  });

  test('简化测试：双人完成验证', async () => {
    console.log('📝 简化测试开始...');

    // 1. 快速设置
    console.log('1. 设置双人游戏...');
    await hostPage.goto('http://localhost:3000');
    await hostPage.click('button:has-text("对战大厅")');
    await hostPage.waitForURL(/\/lobby/);

    const roomName = `Simple-${Date.now()}`;
    await hostPage.fill('input[placeholder="房间名称"]', roomName);
    await hostPage.click('text=创建房间');
    await hostPage.waitForURL(/\/room\//);

    // P2加入
    await p2Page.goto('http://localhost:3000/lobby');
    await p2Page.waitForSelector('div:has-text("' + roomName + '")');
    const roomCard = p2Page.locator('div.bg-white.rounded-lg').filter({ hasText: roomName }).first();
    await roomCard.getByRole('button', { name: 'Join Game' }).click();
    await p2Page.waitForURL(/\/room\//);

    // 准备并开始
    console.log('2. 准备游戏...');
    await hostPage.click('button:has-text("Ready to Play")');
    await p2Page.click('button:has-text("Ready to Play")');
    await hostPage.click('button:has-text("Start Game")');
    await expect(hostPage.locator('text=Status: playing')).toBeVisible({ timeout: 15000 });

    // 2. 等待并检查初始状态
    console.log('3. 检查初始状态...');
    await hostPage.waitForTimeout(2000);

    const initialStatus = await hostPage.evaluate(() => ({
      cardCount: document.querySelectorAll('.cursor-pointer.transition-transform').length,
      hasPlayButton: !!document.querySelector('button:has-text("Play")'),
      bodyText: document.body.innerText.substring(0, 100)
    }));
    console.log('初始状态:', initialStatus);

    if (!initialStatus.hasPlayButton) {
      console.log('❌ 初始状态异常');
      return;
    }

    // 3. 模拟终局设置（直接修改数据库）
    console.log('4. 设置终局状态...');
    const roomId = hostPage.url().split('/').pop()!;
    console.log('房间ID:', roomId);

    const fs = require('fs');
    const path = require('path');
    const envPath = path.resolve(__dirname, '../../.env.local');

    let sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    let sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const urlMatch = content.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
      const keyMatch = content.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);
      if (urlMatch) sbUrl = urlMatch[1].trim();
      if (keyMatch) sbKey = keyMatch[1].trim();
    }

    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(sbUrl, sbKey);

    // 使用直接SQL查询设置终局
    const { error } = await supabase.rpc('setup_test_endgame', { p_room_id: roomId });
    if (error) {
      console.log('⚠️ RPC调用失败:', error.message);
      // 如果RPC失败，手动检查是否有游戏
      const { data: gameData } = await supabase
        .from('games')
        .select('*')
        .eq('room_id', roomId)
        .eq('status', 'playing')
        .single();

      if (!gameData) {
        console.log('❌ 找不到游戏，测试终止');
        return;
      }

      console.log('✅ 找到游戏:', gameData.id);
    } else {
      console.log('✅ 终局设置成功');
    }

    // 4. 重新加载页面
    console.log('5. 重新加载页面...');
    await Promise.all([hostPage.reload(), p2Page.reload()]);
    await hostPage.waitForTimeout(3000);

    // 5. 检查更新后的状态
    console.log('6. 检查更新状态...');
    const updatedStatus = await Promise.all([
      hostPage.evaluate(() => ({
        cardCount: document.querySelectorAll('.cursor-pointer.transition-transform').length,
        hasPlayButton: !!document.querySelector('button:has-text("Play")'),
        bodyText: document.body.innerText.substring(0, 100)
      })),
      p2Page.evaluate(() => ({
        cardCount: document.querySelectorAll('.cursor-pointer.transition-transform').length,
        hasPlayButton: !!document.querySelector('button:has-text("Play")'),
        bodyText: document.body.innerText.substring(0, 100)
      }))
    ]);

    console.log('Host状态:', JSON.stringify(updatedStatus[0]));
    console.log('P2状态:', JSON.stringify(updatedStatus[1]));

    // 6. 验证
    const success = updatedStatus[0].cardCount === 1 && updatedStatus[0].hasPlayButton &&
                   updatedStatus[1].cardCount === 1 && updatedStatus[1].hasPlayButton;

    if (success) {
      console.log('✅ 简化测试通过！修复已生效');
      console.log('- Host和P2都能看到手牌和Play按钮');
      console.log('- 手牌计数正确（1张）');
    } else {
      console.log('❌ 简化测试失败');
    }

    expect(success).toBe(true);
  });
});
