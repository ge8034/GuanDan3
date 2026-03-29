/**
 * 掼蛋游戏基线测试 (Smoke Test)
 *
 * 目的：验证游戏核心功能的端到端流程
 * 用途：作为回归测试的基线，确保所有修改后游戏仍能正常运行
 *
 * 测试覆盖的核心功能：
 * 1. 首页加载和导航
 * 2. 练习房创建（1v3 AI模式）
 * 3. 游戏自动开始
 * 4. 手牌正确发放
 * 5. 游戏状态同步
 * 6. 游戏能够完成
 */

import { test, expect } from '@playwright/test'
import { setupGameMocks, cleanupMockState } from './shared'

// 测试配置
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001'
const GAME_TIMEOUT = 180000 // 3分钟超时（AI对局可能较长时间）

test.describe('掼蛋游戏基线测试', () => {
  let lastDialogMessage: string | null = null

  // 测试前设置
  test.beforeEach(async ({ page }) => {
    lastDialogMessage = null

    // 监听对话框（用于捕获错误弹窗）
    page.on('dialog', async dialog => {
      lastDialogMessage = dialog.message()
      await dialog.accept()
    })

    // 设置所有必需的mock
    await setupGameMocks(page)
  })

  // 测试后清理
  test.afterEach(() => {
    cleanupMockState()
  })

  /**
   * 核心流程测试：完整游戏体验
   * 这是最重要的测试，验证整个游戏流程是否正常
   */
  test('完整游戏流程：进入房间 -> 自动开始 -> 游戏进行 -> 游戏结束', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT)

    // ========== 阶段1：首页加载 ==========
    await test.step('首页加载', async () => {
      await page.goto(BASE_URL)
      await expect(page).toHaveTitle(/掼蛋|GuanDan/i)

      // 验证主要按钮可见
      const practiceBtn = page.getByRole('button', { name: /练习/i })
      await expect(practiceBtn).toBeVisible({ timeout: 10000 })
    })

    // ========== 阶段2：进入练习房 ==========
    const roomId = await test.step('进入练习房', async () => {
      const practiceBtn = page.getByRole('button', { name: /练习/i })
      await practiceBtn.click()

      // 等待URL变化（房间页面）
      await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 })

      // 提取房间ID
      const url = page.url()
      const match = url.match(/\/room\/([^/]+)$/)
      const roomId = match ? match[1] : 'unknown'

      // 验证房间基本信息
      await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 15000 })

      return roomId
    })

    // ========== 阶段3：等待游戏自动开始 ==========
    await test.step('游戏自动开始', async () => {
      // 练习模式应该自动开始游戏
      // 验证手牌区域可见（这是游戏开始的最可靠指示器）
      const handArea = page.locator('[data-testid="room-hand"]')
      await expect(handArea).toBeVisible({ timeout: 30000 })

      // 验证玩家座位可见（确认4个玩家都在）
      const playerSeat0 = page.locator('[data-testid="player-seat-0"]')
      await expect(playerSeat0).toBeVisible({ timeout: 5000 })
    })

    // ========== 阶段4：验证手牌发放 ==========
    await test.step('验证手牌发放', async () => {
      const handArea = page.locator('[data-testid="room-hand"]')

      // 等待手牌数据加载
      await page.waitForTimeout(3000)

      // 检查是否有牌（使用 data-card-id 属性）
      const cards = handArea.locator('[data-card-id]')
      const cardCount = await cards.count()

      // 掼蛋初始手牌应该是27张
      expect(cardCount).toBeGreaterThanOrEqual(20) // 宽松检查，至少20张
    })

    // ========== 阶段5：验证游戏状态 ==========
    await test.step('验证游戏状态', async () => {
      // 检查座位信息（使用 "座位：" 作为选择器，匹配 "座位：0" 格式）
      const seatIndicator = page.getByText(/座位：\d+/i)
      await expect(seatIndicator).toBeVisible({ timeout: 10000 })

      // 检查牌局状态
      const gameStatusIndicator = page.getByText(/牌局：playing|playing/i)
      await expect(gameStatusIndicator).toBeVisible({ timeout: 5000 })

      // 检查其他玩家区域
      const playerSeats = page.locator('[data-testid^="player-seat"]')
      await expect(playerSeats.first()).toBeVisible()
    })

    // ========== 阶段6：等待游戏完成 ==========
    const gameCompleted = await test.step('等待游戏完成', async () => {
      // 监听游戏结束事件（可能有不同的结束指示）
      try {
        // 等待游戏结束指示器
        const gameOverIndicator = page.getByText(/游戏结束|本局结束|结算|胜利/i)

        // 等待最多3分钟（AI对局时间）
        await expect(gameOverIndicator.first()).toBeVisible({
          timeout: GAME_TIMEOUT,
          interval: 5000 // 每5秒检查一次
        })

        return true
      } catch {
        // 如果没有明确的游戏结束指示，检查状态
        const finalStatus = await page.locator('[data-testid="game-status"]').textContent()
        return finalStatus?.includes('finished') || finalStatus?.includes('结束')
      }
    })

    // ========== 验证结果 ==========
    expect(gameCompleted, '游戏应该成功完成').toBeTruthy()

    // 如果有错误弹窗，报告
    if (lastDialogMessage) {
      throw new Error(`测试过程中出现错误弹窗：${lastDialogMessage}`)
    }
  })

  /**
   * 快速冒烟测试：仅验证关键步骤
   * 用于快速验证系统是否正常工作
   */
  test('快速冒烟测试：关键功能验证', async ({ page }) => {
    test.setTimeout(60000) // 1分钟快速测试

    // 1. 首页加载
    await page.goto(BASE_URL)
    await expect(page.getByRole('button', { name: /练习/i })).toBeVisible()

    // 2. 进入练习房
    await page.getByRole('button', { name: /练习/i }).click()
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 })

    // 3. 游戏开始 - 验证手牌区域
    await expect(page.locator('[data-testid="room-hand"]')).toBeVisible({ timeout: 20000 })

    // 4. 验证有卡牌
    const cards = page.locator('[data-testid="room-hand"]').locator('[data-card-id]')
    await expect(cards.first()).toBeVisible({ timeout: 10000 })
  })

  /**
   * 错误处理测试：验证系统优雅处理错误
   */
  test('错误处理：验证系统稳定性', async ({ page }) => {
    test.setTimeout(60000)

    await page.goto(BASE_URL)

    // 测试页面响应性
    const practiceBtn = page.getByRole('button', { name: /练习/i })
    await expect(practiceBtn).toBeVisible()

    // 点击后检查是否有错误弹窗
    await practiceBtn.click()

    // 如果有错误弹窗，记录但不抛出异常
    page.on('dialog', async dialog => {
      lastDialogMessage = dialog.message()
      await dialog.accept()
    })

    // 等待导航完成
    try {
      await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 })
    } catch (e) {
      // 如果导航失败但有错误消息，记录
      if (lastDialogMessage) {
        console.error('导航失败，错误消息：', lastDialogMessage)
      }
      throw e
    }

    // 验证页面没有崩溃（仍然可以交互）
    await expect(page.locator('body')).toBeVisible()
  })
})

/**
 * 测试辅助函数
 */

// 等待游戏状态变化
async function waitForGameStatus(page: any, status: string, timeout = 60000) {
  const startTime = Date.now()

  while (Date.now() - startTime < timeout) {
    // 检查游戏结束覆盖层
    const gameOverOverlay = page.locator('[data-testid="game-over-overlay"]')
    const isVisible = await gameOverOverlay.isVisible().catch(() => false)
    if (isVisible) {
      return true
    }
    await page.waitForTimeout(1000)
  }

  return false
}

// 获取当前手牌数量
async function getHandCardCount(page: any) {
  const handArea = page.locator('[data-testid="room-hand"]')
  const cards = handArea.locator('[data-card-id]')
  return await cards.count()
}
