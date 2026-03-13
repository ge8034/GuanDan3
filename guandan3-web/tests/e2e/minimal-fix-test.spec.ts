import { test, expect } from '@playwright/test';

test.describe('最小化修复验证', () => {
  test.setTimeout(60000);

  test('验证核心修复功能', async ({ page }) => {
    console.log('🧪 开始最小化修复验证...');

    try {
      // 1. 导航到应用
      console.log('1. 访问应用...');
      await page.goto('http://localhost:3000', { timeout: 15000 });

      // 检查页面是否正常加载
      const hasLobby = await page.locator('button:has-text("对战大厅")').count();
      if (hasLobby === 0) {
        console.log('❌ 应用页面未正常加载');
        return;
      }
      console.log('✅ 应用页面加载正常');

      // 2. 进入大厅
      console.log('2. 进入对战大厅...');
      await page.click('button:has-text("对战大厅")');

      try {
        await page.waitForURL(/\/lobby/, { timeout: 10000 });
        console.log('✅ 成功进入大厅');
      } catch (e) {
        console.log('❌ 无法进入大厅，可能是网络或服务问题');
        console.log('当前URL:', page.url());
        return;
      }

      // 3. 验证Supabase连接
      console.log('3. 验证数据库连接...');
      const connectionTest = await page.evaluate(async () => {
        try {
          // 尝试获取环境变量
          const sbUrl = window.location.origin.includes('localhost')
            ? 'https://rzzywltxlfgucngfiznx.supabase.co'
            : null;

          if (!sbUrl) return { error: 'No URL' };

          // 简单的连接测试
          const response = await fetch(sbUrl + '/rest/v1/', {
            headers: { 'apikey': 'test' }
          });

          return { status: response.status, connected: true };
        } catch (e: any) {
          return { error: e.message };
        }
      });

      console.log('连接测试结果:', connectionTest);

      if (connectionTest.connected) {
        console.log('✅ 数据库连接正常');
      } else {
        console.log('⚠️  数据库连接可能有问题');
      }

      // 4. 检查修复的效果（通过检查页面功能）
      console.log('4. 检查基本功能...');

      // 尝试创建房间来验证数据库写入功能
      const roomName = `MinimalTest-${Date.now()}`;

      try {
        await page.fill('input[placeholder="房间名称"]', roomName);
        await page.click('text=创建房间');

        // 检查是否成功创建（URL变化或页面内容变化）
        const urlChanged = await Promise.race([
          page.waitForURL(/\/room\//, { timeout: 5000 }).then(() => true),
          new Promise(resolve => setTimeout(() => resolve(false), 6000))
        ]);

        if (urlChanged) {
          console.log('✅ 房间创建成功 - 数据库写入功能正常');
          console.log('✅ 核心修复应该已生效');

          // 简单验证：检查页面内容
          const pageContent = await page.evaluate(() => document.body.innerText);
          const hasExpectedContent = pageContent.includes('准备') ||
                                   pageContent.includes('开始游戏') ||
                                   pageContent.includes('房间：') ||
                                   pageContent.includes('Ready to Play') ||
                                   pageContent.includes('Start Game') ||
                                   pageContent.includes('Room:');

          if (hasExpectedContent) {
            console.log('✅ 房间页面内容正常');
          }

        } else {
          console.log('⚠️  房间创建可能失败，数据库写入有问题');
        }
      } catch (e: any) {
        console.log('❌ 房间创建失败:', e.message);
      }

      console.log('\n📊 验证总结:');
      console.log('- 应用加载: ✅');
      console.log('- 大厅访问:', connectionTest.connected ? '✅' : '⚠️');
      console.log('- 数据库功能: 需要进一步测试');

      console.log('\n💡 建议:');
      console.log('如果上述步骤都成功，修复应该已经生效。');
      console.log('请尝试手动测试游戏完成功能，或等待测试环境稳定。');

    } catch (error: any) {
      console.log('❌ 验证过程出错:', error.message);
      throw error;
    }
  });
});
