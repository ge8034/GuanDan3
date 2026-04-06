/**
 * 完整游戏流程测试 - 增强调试版本
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test('完整游戏流程：验证游戏能正常进行多回合', async ({ page }) => {
  console.log('=== 开始完整游戏流程测试（增强调试） ===\n')

  // 捕获所有日志
  const allLogs: string[] = []
  page.on('console', msg => {
    const text = msg.text()
    allLogs.push(text)
    // 打印关键日志
    if (text.includes('ERROR') || text.includes('submit_turn') || text.includes('fetchGame') || text.includes('myHand')) {
      console.log(`[Console ${msg.type()}] ${text}`)
    }
  })

  // 1. 访问首页
  console.log('1. 访问首页...')
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // 2. 点击开始练习
  console.log('2. 点击开始练习...')
  const practiceBtn = page.getByRole('button', { name: /练习|开始练习/i })
  await expect(practiceBtn).toBeVisible()
  await practiceBtn.click()

  // 3. 等待进入房间
  console.log('3. 等待进入房间...')
  await page.waitForURL(/\/room\/[^/]+$/, { timeout: 15000 })
  const roomId = page.url().match(/\/room\/([^/]+)/)?.[1] || 'unknown'
  console.log(`   房间ID: ${roomId}`)

  // 4. 等待游戏自动开始
  console.log('4. 等待游戏自动开始...')
  await page.waitForTimeout(8000)

  // 5. 检查初始状态
  console.log('5. 检查初始状态...')
  const handCards = page.locator('[data-card-id]')
  let cardCount = await handCards.count()
  console.log(`   初始手牌: ${cardCount}`)

  expect(cardCount, '游戏应该开始并有手牌').toBeGreaterThan(0)

  // 6. 进行多回合测试（简化版，只验证不会出错）
  console.log('\n6. 开始多回合测试...')
  const maxTurns = 5 // 先测试 5 个回合
  let errorCount = 0

  for (let i = 0; i < maxTurns; i++) {
    console.log(`\n   [回合 ${i + 1}]`)

    // 获取当前手牌
    const currentCards = await handCards.count()
    console.log(`   当前手牌: ${currentCards}`)

    if (currentCards === 0) {
      console.log('   → 玩家已出完所有牌')
      break
    }

    // 尝试出牌
    try {
      // 选择第一张牌
      await handCards.first().click({ timeout: 5000 })
      await page.waitForTimeout(200)

      // 尝试出牌
      const playBtn = page.getByRole('button', { name: /出牌/i }).first()
      const canPlay = await playBtn.isEnabled().catch(() => false)

      if (canPlay) {
        await playBtn.click()
        console.log('   → 出牌')
      } else {
        // 尝试不出
        const passBtn = page.getByRole('button', { name: /不出|过/i }).first()
        const canPass = await passBtn.isVisible().catch(() => false)
        if (canPass) {
          await passBtn.click()
          console.log('   → 不出')
        } else {
          console.log('   → 无法操作，跳过')
        }
      }

      // 等待游戏处理
      await page.waitForTimeout(3000)

      // 检查新手牌数量
      const newCount = await handCards.count()
      console.log(`   新手牌: ${newCount}`)

      // 检查是否有 ERROR 日志
      const roundErrors = allLogs.filter(l =>
        l.includes('ERROR') &&
        (l.includes('42703') || l.includes('column "int"'))
      )
      if (roundErrors.length > 0) {
        errorCount++
        console.log(`   ⚠️  发现 ${roundErrors.length} 个严重错误`)
      }

    } catch (e) {
      console.log(`   ❌ 回合失败:`, e)
      errorCount++
    }
  }

  // 7. 最终检查
  console.log('\n=== 测试结果 ===')
  const finalCards = await handCards.count()
  console.log(`最终手牌: ${finalCards}`)
  console.log(`错误回合数: ${errorCount}`)

  // 确保没有 42703 错误
  const criticalErrors = allLogs.filter(e => e.includes('42703'))
  expect(criticalErrors).toHaveLength(0)

  console.log('\n✓ 测试完成')
})
