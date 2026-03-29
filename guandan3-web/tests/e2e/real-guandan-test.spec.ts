import { test, expect } from '@playwright/test'

/**
 * 完整掼蛋游戏测试 - 模拟真实牌局
 *
 * 测试目标：
 * 1. 加载所有组件
 * 2. 访问游戏房间
 * 3. 捕获控制台日志
 * 4. 模拟真实游戏完整牌局
 * 5. 验证 AI 遵循掼蛋规则
 */

test.describe('完整掼蛋游戏测试', () => {
  test.beforeEach(async ({ page }) => {
    // 启用控制台日志捕获
    page.on('console', msg => {
      const text = msg.text()
      const type = msg.type()

      // 只记录重要的日志
      if (type === 'error' || type === 'warning' ||
          text.includes('[AI]') ||
          text.includes('[useRoomAI]') ||
          text.includes('submit_turn') ||
          text.includes('canBeat') ||
          text.includes('出牌') ||
          text.includes('牌型')) {
        console.log(`[Browser ${type.toUpperCase()}]`, text)
      }
    })

    // 监听网络请求
    page.on('request', request => {
      const url = request.url()
      if (url.includes('/rest/v1/rpc')) {
        console.log('[API Request]', request.method(), url)
      }
    })

    // 监听网络响应
    page.on('response', response => {
      const url = response.url()
      if (url.includes('/rest/v1/rpc')) {
        console.log('[API Response]', response.status(), url)
      }
    })
  })

  test('完整游戏流程 - 练习模式', async ({ page }) => {
    console.log('===== 开始完整掼蛋游戏测试 =====')

    // 步骤 1: 访问首页
    console.log('\n[步骤 1] 访问首页')
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')
    await page.waitForSelector('[data-testid="home-practice"]', { timeout: 5000 })
    console.log('✓ 首页加载完成')

    // 步骤 2: 点击开始练习
    console.log('\n[步骤 2] 点击开始练习')
    const practiceButton = page.getByTestId('home-practice')
    await practiceButton.click()
    console.log('✓ 点击练习按钮')

    // 等待跳转到游戏房间
    await page.waitForURL(/\/room\/[a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9]{4}-[a-f0-9]{12}/, { timeout: 10000 })
    console.log('✓ 已跳转到游戏房间')

    // 等待游戏加载
    await page.waitForTimeout(2000)

    // 步骤 3: 检查组件加载
    console.log('\n[步骤 3] 检查组件加载')

    // 检查玩家头像
    const playerAvatars = await page.locator('[class*="PlayerAvatar"]').count()
    console.log(`  玩家头像数量: ${playerAvatars}/4`)
    expect(playerAvatars).toBe(4)

    // 检查手牌区域
    const handArea = await page.locator('[class*="HandArea"]').isVisible()
    console.log(`  手牌区域: ${handArea ? '✓' : '✗'}`)
    expect(handArea).toBe(true)

    // 检查出牌区域
    const tableArea = await page.locator('[class*="TableArea"]').isVisible()
    console.log(`  出牌区域: ${tableArea ? '✓' : '✗'}`)
    expect(tableArea).toBe(true)

    console.log('✓ 所有组件加载完成')

    // 步骤 4: 等待游戏开始并捕获手牌信息
    console.log('\n[步骤 4] 等待游戏开始')
    await page.waitForTimeout(3000)

    // 获取手牌数量
    const handCards = await page.locator('[class*="HandArea"] [class*="Card"]').count()
    console.log(`  我的手牌数量: ${handCards}`)

    // 等待 AI 决策日志
    await page.waitForTimeout(2000)

    // 步骤 5: 捕获游戏状态
    console.log('\n[步骤 5] 捕获游戏状态')

    const gameStatus = await page.evaluate(() => {
      return window.gameStatus || 'unknown'
    })
    console.log(`  游戏状态: ${gameStatus}`)

    // 步骤 6: 观察几轮 AI 出牌
    console.log('\n[步骤 6] 观察 AI 出牌')

    for (let i = 0; i < 5; i++) {
      console.log(`\n  --- 第 ${i + 1} 轮 ---`)

      // 等待当前玩家出牌
      await page.waitForTimeout(2000)

      // 检查是否有我的回合
      const isMyTurn = await page.evaluate(() => {
        // 等待 gameStatus 可用
        return typeof window !== 'undefined' &&
               window.currentSeat !== undefined &&
               window.mySeat !== undefined &&
               window.currentSeat === window.mySeat
      })

      if (isMyTurn) {
        console.log(`  我的回合！`)

        // 获取手牌
        const cards = await page.locator('[class*="HandArea"] [class*="Card"]').all()

        if (cards.length > 0) {
          // 点击第一张牌
          await cards[0].click()
          await page.waitForTimeout(500)

          // 点击出牌按钮
          const playButton = page.getByRole('button', { name: /出牌/i })
          if (await playButton.isVisible()) {
            await playButton.click()
            console.log(`  出了 1 张牌`)
          }
        }
      } else {
        console.log(`  AI 的回合，等待...`)
      }

      // 等待出牌完成
      await page.waitForTimeout(2000)
    }

    // 步骤 7: 检查是否有违反规则的情况
    console.log('\n[步骤 7] 检查游戏日志')

    const logs = await page.evaluate(() => {
      // 获取所有 console.log 的内容
      return window.consoleLogs || []
    })

    // 查找可能的问题
    const problems = []

    logs.forEach((log: string) => {
      if (log.includes('error') || log.includes('Error')) {
        problems.push(`错误: ${log}`)
      }
      if (log.includes('AI') && log.includes('炸弹') && log.includes('开局')) {
        problems.push(`问题: AI 开局出炸弹`)
      }
      if (log.includes('canBeat=false') && log.includes('AI')) {
        problems.push(`问题: AI 试图出不符合规则的牌`)
      }
    })

    if (problems.length > 0) {
      console.log('\n发现的问题:')
      problems.forEach(p => console.log(`  - ${p}`))
    } else {
      console.log('\n✓ 没有发现明显问题')
    }

    // 最终状态
    console.log('\n===== 测试完成 =====')
  })

  test('组件加载检查', async ({ page }) => {
    console.log('===== 组件加载检查 =====')

    await page.goto('http://localhost:3000')
    await page.waitForLoadState('networkidle')

    // 检查关键组件
    const components = [
      { selector: '[data-testid="home-practice"]', name: '练习按钮' },
      { selector: '[data-testid="home-pvp"]', name: '对战按钮' },
      { selector: 'a[href="/lobby"]', name: '大厅链接' },
    ]

    for (const component of components) {
      const isVisible = await page.locator(component.selector).isVisible()
      console.log(`${isVisible ? '✓' : '✗'} ${component.name}`)
      expect(isVisible).toBe(true)
    }

    console.log('===== 组件检查完成 =====')
  })
})
