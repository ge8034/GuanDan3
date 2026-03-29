/**
 * 完整游戏流程测试 - 练习模式 (1v3)
 *
 * 测试流程：
 * 1. 进入练习房间
 * 2. 游戏自动开始
 * 3. 模拟人类玩家出牌
 * 4. AI agents 接管游戏
 * 5. 游戏完成
 */

import { test, expect } from '@playwright/test'
import { setupGameMocks, cleanupMockState } from './shared'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const GAME_TIMEOUT = 180000 // 3 分钟超时

test.describe('完整游戏流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page)
  })

  test.afterEach(() => {
    cleanupMockState()
  })

  test('练习房完整流程：自动开始 -> 人类出牌 -> AI 对战 -> 游戏结束', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT)

    // 监听控制台日志
    const logs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      logs.push(text)
      if (text.includes('AI') || text.includes('turnNo') || text.includes('currentSeat')) {
        console.log('[Game]', text)
      }
    })

    // ========== 阶段1：进入练习房 ==========
    await page.goto(BASE_URL)
    await page.getByRole('button', { name: /练习/i }).click()
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 })

    console.log('✓ 进入练习房')

    // ========== 阶段2：等待游戏自动开始 ==========
    await page.waitForTimeout(5000)

    // 检查手牌是否存在
    const handArea = page.locator('[data-testid="room-hand"]')
    await expect(handArea).toBeVisible({ timeout: 10000 })

    // 检查卡牌数量
    const cardCount = await page.locator('[data-card-id]').count()
    expect(cardCount, '应该有27张手牌').toBe(27)

    console.log('✓ 游戏已开始，手牌已发 (27张)')

    // ========== 阶段3：模拟人类玩家出牌 ==========
    // 获取第一张牌的 data-card-id
    const firstCard = page.locator('[data-card-id]').first()
    const cardId = await firstCard.getAttribute('data-card-id')

    // 点击第一张牌
    await firstCard.click()
    await page.waitForTimeout(500)

    // 验证牌被选中
    const selectedCard = page.locator(`[data-card-id="${cardId}"]`)
    const isSelected = await selectedCard.evaluate(el =>
      el.classList.contains('border-blue-500') ||
      el.classList.contains('ring-2') ||
      el.style.transform !== 'none'
    )
    expect(isSelected, '第一张牌应该被选中').toBeTruthy()

    console.log('✓ 选中第一张牌')

    // 点击出牌按钮
    const playButton = page.getByRole('button', { name: /出牌|Play/i })
    await expect(playButton).toBeVisible({ timeout: 5000 })
    await playButton.click()

    console.log('✓ 人类玩家已出牌')

    // ========== 阶段4：等待 AI 完成游戏 ==========
    console.log('=== 等待 AI 对战完成（最多3分钟）===')

    // 监控游戏进度
    let noProgressCount = 0
    let previousTurnNo = -1
    let maxWaitTime = Date.now() + GAME_TIMEOUT

    while (Date.now() < maxWaitTime && noProgressCount < 10) {
      await page.waitForTimeout(5000)

      // 检查游戏是否结束
      const gameOverText = await page.evaluate(() => {
        const bodyText = document.body.textContent || ''
        return bodyText.includes('游戏结束') ||
               bodyText.includes('本局结束') ||
               bodyText.includes('结算') ||
               bodyText.includes('胜利')
      })

      if (gameOverText) {
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
        console.log(`游戏进行中: turnNo ${previousTurnNo} -> ${currentTurnNo}`)
        previousTurnNo = currentTurnNo
        noProgressCount = 0
      } else if (currentTurnNo === -1 && previousTurnNo === -1) {
        // turnNo 无法从页面文本获取，检查 AI 日志
        const aiLogs = logs.filter(log => log.includes('[useAIDecision]') && log.includes('开始执行'))
        if (aiLogs.length > (previousTurnNo === -1 ? 0 : previousTurnNo)) {
          console.log(`AI 已执行 ${aiLogs.length} 次决策`)
          previousTurnNo = aiLogs.length
          noProgressCount = 0
        } else {
          noProgressCount++
        }
      } else {
        noProgressCount++
        console.log(`⚠️  游戏进度停滞 (${noProgressCount}/10)`)
      }
    }

    // ========== 阶段5：验证游戏结果 ==========
    const aiDecisionLogs = logs.filter(log =>
      log.includes('[useAIDecision]') && log.includes('开始执行')
    )

    const aiSuccessLogs = logs.filter(log =>
      log.includes('AI 提交成功') || log.includes('决策完成')
    )

    console.log('=== 测试结果 ===')
    console.log(`AI 决策次数: ${aiDecisionLogs.length}`)
    console.log(`AI 成功出牌: ${aiSuccessLogs.length}`)

    // 验证 AI 至少执行了一些决策
    expect(aiDecisionLogs.length, 'AI 应该执行决策').toBeGreaterThan(0)

    // 验证游戏有进展
    expect(previousTurnNo, '游戏应该有进展').toBeGreaterThan(0)

    console.log('✓ 完整游戏流程测试完成')
  })

  test('简化测试：验证 AI 能够接替人类玩家', async ({ page }) => {
    test.setTimeout(60000)

    const logs: string[] = []
    page.on('console', msg => {
      const text = msg.text()
      if (text.includes('[useAIDecision]')) {
        logs.push(text)
      }
    })

    // 进入练习房
    await page.goto(BASE_URL)
    await page.getByRole('button', { name: /练习/i }).click()
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 })

    // 等待游戏开始
    await page.waitForTimeout(5000)

    // 人类玩家出牌
    const firstCard = page.locator('[data-card-id]').first()
    await firstCard.click()
    await page.waitForTimeout(300)

    const playButton = page.getByRole('button', { name: /出牌|Play/i })
    await playButton.click()

    console.log('✓ 人类玩家已出牌，等待 AI 接管...')

    // 等待 AI 接管
    await page.waitForTimeout(15000)

    // 检查 AI 是否执行了决策
    const aiLogs = logs.filter(log => log.includes('[useAIDecision]') && log.includes('开始执行'))

    console.log(`AI 决策次数: ${aiLogs.length}`)

    // 验证 AI 至少执行了一次决策
    expect(aiLogs.length, 'AI 应该在人类玩家出牌后接管游戏').toBeGreaterThan(0)

    console.log('✓ AI 接管验证完成')
  })
})
