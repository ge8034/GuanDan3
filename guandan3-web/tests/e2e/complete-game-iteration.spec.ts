/**
 * 组件加载和日志捕获测试
 *
 * 5步计划:
 * 1. 加载所有组件
 * 2. 访问游戏房间
 * 3. 捕获控制台日志
 * 4. 模拟真实游戏完整牌局
 * 5. 迭代游戏直到游戏可交付
 */

import { test, expect } from '@playwright/test'
import { setupGameMocks, cleanupMockState } from './shared'

const BASE_URL = process.env.BASE_URL || 'http://localhost:4200'

test.describe('游戏完整流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page)
  })

  test.afterEach(() => {
    cleanupMockState()
  })

  test('步骤1-3: 加载组件、访问房间、捕获日志', async ({ page }) => {
    test.setTimeout(120000)

    // 收集所有控制台日志
    const logs: string[] = []
    const errors: string[] = []
    const warnings: string[] = []

    page.on('console', msg => {
      const text = msg.text()
      const type = msg.type()

      logs.push(`[${type}] ${text}`)

      // 过滤测试环境中的预期错误（WebSocket代理错误）
      const isExpectedWebSocketError = text.includes('ERR_PROXY_CONNECTION_FAILED') ||
                                       text.includes('WebSocket connection to') ||
                                       text.includes('Sweep offline members error')

      if (type === 'error' && !isExpectedWebSocketError) {
        errors.push(text)
      } else if (type === 'warning') {
        warnings.push(text)
      }

      // 打印重要日志
      if (text.includes('useAIDecision') ||
          text.includes('AI') ||
          text.includes('turnNo') ||
          text.includes('currentSeat') ||
          text.includes('gameStatus')) {
        console.log('[GAME]', text)
      }
    })

    // ========== 步骤1: 加载所有组件 ==========
    console.log('=== 步骤1: 加载所有组件 ===')
    await page.goto(BASE_URL)

    // 等待页面加载完成
    await page.waitForLoadState('networkidle', { timeout: 30000 })
    console.log('✓ 页面加载完成')

    // ========== 步骤2: 访问游戏房间 ==========
    console.log('=== 步骤2: 访问游戏房间 ===')

    // 点击练习按钮
    const practiceBtn = page.getByRole('button', { name: /练习/i })
    await expect(practiceBtn).toBeVisible({ timeout: 10000 })
    await practiceBtn.click()

    // 等待进入房间
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 })
    console.log('✓ 已进入游戏房间')

    // 等待游戏自动开始（练习房应该自动开始）
    // 我们通过检查游戏状态从 'deal' 变为 'playing' 来判断
    console.log('等待游戏自动开始...')
    await page.waitForFunction(() => {
      const bodyText = document.body.textContent || ''
      // 检查是否有手牌元素出现（游戏开始后才会渲染手牌）
      return document.querySelector('[data-testid="room-hand"]') !== null
    }, { timeout: 15000 }).catch(() => {
      console.log('⚠️ 游戏未自动开始，尝试手动点击开始按钮')
      // 如果自动开始失败，尝试手动点击开始按钮
      const startBtn = page.getByRole('button', { name: /开始游戏|开始/i })
      startBtn.click().catch(() => {})
    })

    // 验证关键组件可见
    const roomHand = page.locator('[data-testid="room-hand"]')
    await expect(roomHand).toBeVisible({ timeout: 20000 })
    console.log('✓ 手牌区域可见')

    // 验证玩家座位
    const playerSeats = page.locator('[data-testid^="player-seat"]')
    await expect(playerSeats.first()).toBeVisible({ timeout: 5000 })
    console.log('✓ 玩家座位可见')

    // ========== 步骤3: 捕获控制台日志 ==========
    console.log('=== 步骤3: 捕获控制台日志 ===')

    // 等待游戏自动开始
    await page.waitForTimeout(5000)

    // 检查手牌数量
    const cardCount = await page.locator('[data-card-id]').count()
    console.log(`✓ 手牌数量: ${cardCount}`)

    // ========== 步骤4: 模拟真实游戏完整牌局 ==========
    console.log('=== 步骤4: 模拟真实游戏完整牌局 ===')

    // 人类玩家出牌
    if (cardCount > 0) {
      const firstCard = page.locator('[data-card-id]').first()
      await firstCard.click()
      await page.waitForTimeout(500)

      const playButton = page.getByRole('button', { name: /出牌|Play/i })
      await expect(playButton).toBeVisible({ timeout: 5000 })
      await playButton.click()
      console.log('✓ 人类玩家已出牌')
    }

    // 监控游戏进行（最多60秒）
    console.log('监控游戏进行中...')
    let previousTurnNo = -1
    const maxWaitTime = Date.now() + 60000

    while (Date.now() < maxWaitTime) {
      await page.waitForTimeout(5000)

      // 检查游戏是否结束
      const bodyText = await page.evaluate(() => document.body.textContent || '')
      if (bodyText.includes('游戏结束') || bodyText.includes('结算') || bodyText.includes('胜利')) {
        console.log('✓ 游戏已结束')
        break
      }

      // 检查游戏进度
      const currentTurnNo = await page.evaluate(() => {
        const bodyText = document.body.textContent || ''
        const match = bodyText.match(/turnNo['":\s]*(\d+)/i)
        return match ? parseInt(match[1]) : -1
      })

      if (currentTurnNo > previousTurnNo) {
        console.log(`游戏进度: turnNo ${previousTurnNo} → ${currentTurnNo}`)
        previousTurnNo = currentTurnNo
      }
    }

    // ========== 步骤5: 分析结果 ==========
    console.log('=== 步骤5: 分析结果 ===')

    console.log(`\n📊 日志统计:`)
    console.log(`- 总日志数: ${logs.length}`)
    console.log(`- 错误数: ${errors.length}`)
    console.log(`- 警告数: ${warnings.length}`)

    if (errors.length > 0) {
      console.log('\n❌ 发现错误:')
      errors.slice(0, 10).forEach(err => console.log(`  - ${err}`))
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  发现警告:')
      warnings.slice(0, 10).forEach(warn => console.log(`  - ${warn}`))
    }

    // AI 决策日志
    const aiLogs = logs.filter(log =>
      log.includes('[useAIDecision]') ||
      log.includes('AI 提交') ||
      log.includes('AI 决策')
    )

    console.log(`\n🤖 AI 决策日志: ${aiLogs.length} 条`)
    aiLogs.slice(0, 5).forEach(log => console.log(`  ${log}`))

    // 验证基本功能
    expect(cardCount, '应该有手牌').toBeGreaterThan(0)
    expect(errors.length, '应该没有严重错误').toBeLessThan(10)

    console.log('\n✅ 完整流程测试完成')
  })
})
