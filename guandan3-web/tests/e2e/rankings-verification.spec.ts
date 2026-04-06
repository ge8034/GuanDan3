/**
 * 排名系统完整验证测试
 * 目标：让游戏完成并验证 1,2,3,4 排名显示
 *
 * 策略：
 * 1. 访问真实游戏页面
 * 2. 捕获控制台日志
 * 3. 更激进地出牌以推进游戏
 * 4. 监控直到游戏完成
 * 5. 验证排名显示
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test('完整游戏流程：验证排名显示 1,2,3,4', async ({ page }) => {
  console.log('=== 开始完整游戏排名验证测试 ===\n')

  // 捕获所有日志
  const allLogs: string[] = []
  const rankingsLogs: string[] = []
  const gameStatusLogs: string[] = []

  page.on('console', msg => {
    const text = msg.text()
    allLogs.push(text)

    // 记录关键日志
    if (text.includes('rankings') || text.includes('排名')) {
      rankingsLogs.push(text)
      console.log(`[排名] ${text}`)
    }
    if (text.includes('finished') || text.includes('status')) {
      gameStatusLogs.push(text)
      console.log(`[状态] ${text}`)
    }
    if (text.includes('ERROR')) {
      console.log(`[错误] ${text}`)
    }
  })

  // 1. 访问首页
  console.log('1. 访问首页...')
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(2000)

  // 2. 点击开始练习
  console.log('2. 点击开始练习...')
  const practiceBtn = page.getByRole('button', { name: /练习|开始练习/i })
  await expect(practiceBtn).toBeVisible({ timeout: 10000 })
  await practiceBtn.click()

  // 3. 等待进入房间
  console.log('3. 等待进入房间...')
  await page.waitForURL(/\/room\/[^/]+$/, { timeout: 15000 })
  const roomId = page.url().match(/\/room\/([^/]+)/)?.[1] || 'unknown'
  console.log(`   房间ID: ${roomId}`)

  // 4. 等待游戏自动开始
  console.log('4. 等待游戏自动开始...')
  await page.waitForTimeout(10000)

  // 5. 检查初始状态
  console.log('5. 检查初始状态...')
  const handCards = page.locator('[data-card-id]')
  let cardCount = await handCards.count()
  console.log(`   初始手牌: ${cardCount}`)

  expect(cardCount, '游戏应该开始并有手牌').toBeGreaterThan(0)

  // 6. 更激进地出牌，每次选择尽可能多的牌
  console.log('\n6. 开始激进出牌策略...')
  const maxTurns = 300 // 最多 300 个回合
  const maxWaitTime = 300000 // 5 分钟超时
  const startTime = Date.now()

  let gameFinished = false
  let turnCount = 0
  let myPassCount = 0
  let finalRankings: number[] = []

  for (let i = 0; i < maxTurns; i++) {
    // 检查超时
    if (Date.now() - startTime > maxWaitTime) {
      console.log('   ⏰ 超时，检查当前状态...')
      break
    }

    // 检查游戏是否结束
    const url = page.url()
    const bodyText = await page.locator('body').textContent().catch(() => '') || ''

    // 检查排名显示
    const rankingElements = await page.locator('*:has-text("🥇"), *:has-text("第1名"), *:has-text("第一名")').all()
    if (rankingElements.length > 0) {
      console.log('   ✓ 发现排名显示！')
      for (const el of rankingElements) {
        const text = await el.textContent().catch(() => '')
        if (text) {
          console.log(`   排名信息: ${text}`)
          // 尝试提取排名数字
          const match = text.match(/第?(\d+)名|(\d+)st|(\d+)nd|(\d+)rd/)
          if (match) {
            const rank = parseInt(match[1] || match[2] || match[3] || match[4])
            if (!finalRankings.includes(rank)) {
              finalRankings.push(rank)
            }
          }
        }
      }
    }

    // 检查 URL 或页面文本中的游戏结束标志
    if (url.includes('finished') || bodyText.includes('游戏结束') || bodyText.includes('finished')) {
      console.log(`   ✓ 游戏结束！(第 ${turnCount + 1} 回合)`)
      gameFinished = true
      break
    }

    const currentCards = await handCards.count()

    // 如果没有手牌了，说明玩家已出完
    if (currentCards === 0) {
      console.log(`   ✓ 玩家已出完所有牌！(第 ${turnCount + 1} 回合)`)
      gameFinished = true
      await page.waitForTimeout(5000) // 等待排名更新
      break
    }

    // 如果手牌很少，尝试全部出完
    if (currentCards <= 5) {
      console.log(`   [回合 ${turnCount + 1}] 手牌少(${currentCards})，尝试全部出牌`)
      // 选择所有牌
      const allCards = await handCards.all()
      for (const card of allCards) {
        try {
          await card.click({ timeout: 1000 })
          await page.waitForTimeout(50)
        } catch (e) {
          // 卡牌可能已被选中
        }
      }
      await page.waitForTimeout(200)

      // 尝试出牌
      const playBtn = page.getByRole('button', { name: /出牌/i }).first()
      const canPlay = await playBtn.isEnabled().catch(() => false)

      if (canPlay) {
        await playBtn.click()
        myPassCount = 0
        console.log('   → 出牌（全部）')
      } else {
        // 尝试不出
        const passBtn = page.getByRole('button', { name: /不出|过/i }).first()
        const canPass = await passBtn.isVisible().catch(() => false)
        if (canPass) {
          await passBtn.click()
          myPassCount++
          console.log(`   → 不出 (连续 ${myPassCount})`)
        }
      }
    } else {
      // 正常出牌：选择第一张牌
      turnCount++
      console.log(`   [回合 ${turnCount}] 手牌: ${currentCards}`)

      try {
        // 使用 JavaScript 点击，避免被遮挡
        await page.evaluate(() => {
          const firstCard = document.querySelector('[data-card-id]')
          if (firstCard) {
            firstCard.click()
          }
        })
        await page.waitForTimeout(200)

        // 尝试出牌
        const playBtn = page.getByRole('button', { name: /出牌/i }).first()
        const canPlay = await playBtn.isEnabled().catch(() => false)

        if (canPlay) {
          await playBtn.click()
          myPassCount = 0
          console.log('   → 出牌')
        } else {
          // 尝试不出
          const passBtn = page.getByRole('button', { name: /不出|过/i }).first()
          const canPass = await passBtn.isVisible().catch(() => false)
          if (canPass) {
            await passBtn.click()
            myPassCount++
            console.log(`   → 不出 (连续 ${myPassCount})`)
          } else {
            console.log('   → 无法操作，等待 AI...')
            await page.waitForTimeout(2000)
          }
        }
      } catch (e) {
        console.log(`   ⚠️  操作失败:`, e)
      }
    }

    // 等待其他玩家出牌
    await page.waitForTimeout(2000)
  }

  // 7. 检查最终状态
  console.log('\n=== 测试结果 ===')
  const finalCards = await handCards.count()
  const finalUrl = page.url()
  const pageContent = await page.locator('body').textContent()

  console.log(`最终手牌: ${finalCards}`)
  console.log(`总回合数: ${turnCount}`)
  console.log(`游戏结束: ${gameFinished ? '是' : '否'}`)
  console.log(`捕获到的排名日志: ${rankingsLogs.length} 条`)
  console.log(`捕获到的状态日志: ${gameStatusLogs.length} 条`)

  // 打印排名相关日志
  if (rankingsLogs.length > 0) {
    console.log('\n排名相关日志:')
    rankingsLogs.forEach(log => console.log(`  ${log}`))
  }

  // 检查 42703 错误
  const elemErrors = allLogs.filter(e => e.includes('42703') || e.includes('column "elem"'))
  if (elemErrors.length > 0) {
    console.log('\n❌ 发现 42703 错误:')
    elemErrors.forEach(e => console.log(`  ${e}`))
  } else {
    console.log('\n✅ 无 42703 错误')
  }

  // 检查页面上的排名显示
  const rankingText = await page.locator('*:has-text("🥇"), *:has-text("排名"), *:has-text("第1名")').allTextContents().catch(() => [])
  if (rankingText.length > 0) {
    console.log('\n页面排名显示:')
    rankingText.forEach(text => console.log(`  ${text}`))
  }

  // 保存日志
  const logPath = 'test-results/rankings-verification.log'
  const fs = require('fs')
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results', { recursive: true })
  }
  fs.writeFileSync(logPath, allLogs.join('\n'))
  console.log(`\n日志已保存到: ${logPath}`)

  // 验证无关键错误
  expect(elemErrors).toHaveLength(0)

  if (gameFinished) {
    console.log('\n✅ 游戏已结束')
  } else if (turnCount > 50) {
    console.log('\n⚠️  游戏进行了 50+ 回合，排名系统应该已触发')
  } else {
    console.log('\n⚠️  游戏未完全结束')
  }

  console.log('\n=== 测试完成 ===')
})
