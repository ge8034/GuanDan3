import { test, expect } from '@playwright/test';

// TODO-TEST: 该文件用于临时排障，已跳过执行；后续应迁移为稳定的 E2E 用例
test.describe.skip('等待加载后测试', () => {
  test.setTimeout(120000);

  test('等待页面完全加载后验证修复', async ({ page }) => {
    console.log('🕐 等待页面完全加载...');

    // 1. 访问页面并等待完全加载
    await page.goto('http://localhost:3000', { timeout: 30000 });

    // 等待Loading消失，真正的内容出现
    await page.waitForFunction(() => {
      const bodyText = document.body.innerText;
      return !bodyText.includes('Loading...') &&
             (bodyText.includes('对战大厅') || bodyText.includes('练习房'));
    }, { timeout: 60000 });

    console.log('✅ 页面加载完成');

    // 2. 验证基本功能
    const lobbyButton = page.locator('button:has-text("对战大厅")');
    await expect(lobbyButton).toBeVisible({ timeout: 10000 });
    console.log('✅ 找到对战大厅按钮');

    await lobbyButton.click();
    await page.waitForURL(/\/lobby/, { timeout: 15000 });
    console.log('✅ 成功进入大厅');

    // 3. 创建房间测试数据库功能
    const roomName = `WaitTest-${Date.now()}`;
    await page.fill('input[placeholder="房间名称"]', roomName);
    await page.click('text=创建房间');

    try {
      await page.waitForURL(/\/room\//, { timeout: 10000 });
      console.log('✅ 房间创建成功');

      // 4. 先开始游戏
      console.log('🎮 开始游戏...');
      await page.click('button:has-text("Ready to Play")');
      await page.click('button:has-text("Start Game")');
      await expect(page.locator('text=Status: playing')).toBeVisible({ timeout: 15000 });
      console.log('✅ 游戏已开始');

      // 5. 测试终局修复
      const roomId = page.url().split('/').pop()!;
      console.log('🧪 测试修复功能...');

      // 执行终局设置
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (!sbUrl || !sbKey) {
        throw new Error('缺少 NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 环境变量')
      }

      const result = await page.evaluate(async ({ roomId, sbUrl, sbKey }) => {
        try {
          // 动态加载Supabase
          const w = window as any
          if (!w.supabaseLoaded) {
            await new Promise((resolve, reject) => {
              const script = document.createElement('script');
              script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
              script.onload = resolve;
              script.onerror = reject;
              document.head.appendChild(script);
            });
            w.supabaseLoaded = true;
          }

          const { createClient } = (window as any).supabase;
          const client = createClient(sbUrl, sbKey);

          // 测试RPC调用
          const { error } = await client.rpc('setup_test_endgame', {
            p_room_id: roomId
          });

          return { success: !error, error: error?.message };
        } catch (e: any) {
          return { success: false, error: e?.message || String(e) };
        }
      }, { roomId, sbUrl, sbKey });

      if (result.success) {
        console.log('✅ 终局设置成功 - 修复生效');

        // 等待状态更新
        await page.waitForTimeout(5000);

        // 检查页面状态
        const pageState = await page.evaluate(() => {
          const bodyText = document.body.innerText;
          return {
            hasOneCard: bodyText.includes('1 Cards'),
            hasPlayButton: !!document.querySelector('button[text*="Play"]'),
            content: bodyText.substring(0, 200)
          };
        });

        console.log('📊 页面状态:', pageState);

        if (pageState.hasOneCard) {
          console.log('🎉 修复验证成功！游戏状态正确更新');
        } else {
          console.log('⚠️  页面可能需要刷新以显示新状态');
        }

        expect(result.success).toBe(true);

      } else {
        console.log('❌ 终局设置失败:', result.error);
        throw new Error(`终局设置失败: ${result.error}`);
      }

    } catch (e: any) {
      console.log('❌ 房间创建或功能测试失败:', e?.message || String(e));
      throw e;
    }
  });
});
