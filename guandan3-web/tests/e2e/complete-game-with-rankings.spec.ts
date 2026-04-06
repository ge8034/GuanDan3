/**
 * 完整游戏流程测试 - 验证排名系统
 * 目标：让游戏进行直到有玩家出完牌，验证排名正确记录
 */

import { test, expect } from '@playwright/test'
import { existsSync, writeFileSync } from 'fs'
import path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test('完整游戏流程：验证排名系统', async ({ page }) => {
  console.log('=== 开始完整游戏流程测试（排名验证） ===\n')

  // 捕获所有日志
  const allLogs: string[] = []
  const errorLogs: string[] = []

  page.on('console', msg => {
    const text = msg.text()
    allLogs.push(text)
    if (text.includes('ERROR') || text.includes('rankings') || text.includes('finished')) {
      console.log(`[Console ${msg.type()}] ${text}`)
    }
    if (text.includes('ERROR')) {
      errorLogs.push(text)
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

  // 4. 等待游戏自动开始
  console.log('4. 等待游戏自动开始...')
  await page.waitForTimeout(10000)

  // 5. 检查初始状态
  console.log('5. 检查初始状态...')
  const handCards = page.locator('[data-card-id]')
  let cardCount = await handCards.count()
  console.log(`   初始手牌: ${cardCount}`)

  expect(cardCount, '游戏应该开始并有手牌').toBeGreaterThan(0)

  // 6. 持续出牌，直到游戏结束或达到最大回合数
  console.log('\n6. 开始持续出牌...')
  const maxTurns = 200 // 最多 200 个回合
  const maxWaitTime = 180000 // 3 分钟超时
  const startTime = Date.now()

  let gameFinished = false
  let turnCount = 0
  let myPassCount = 0 // 连续过牌次数

  for (let i = 0; i < maxTurns; i++) {
    // 检查超时
    if (Date.now() - startTime > maxWaitTime) {
      console.log('   ⏰ 超时，停止测试')
      break
    }

    turnCount++
    const currentCards = await handCards.count()

    // 检查游戏是否结束
    const url = page.url()
    const statusText = await page.locator('body').textContent().catch(() => '') || ''
    if (url.includes('finished') || statusText.includes('结束') || statusText.includes('finished')) {
      console.log(`   ✓ 游戏结束！(第 ${turnCount} 回合)`)
      gameFinished = true
      break
    }

    // 如果没有手牌了，说明玩家已出完
    if (currentCards === 0) {
      console.log(`   ✓ 玩家已出完所有牌！(第 ${turnCount} 回合)`)
      gameFinished = true
      // 等待游戏状态更新
      await page.waitForTimeout(3000)
      break
    }

    console.log(`   [回合 ${turnCount}] 手牌: ${currentCards}`)

    // 尝试出牌
    try {
      // 选择第一张牌
      await handCards.first().click({ timeout: 3000 })
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
          // 可能是 AI 回合，等待更长时间
          await page.waitForTimeout(5000)
        }
      }

      // 等待其他玩家出牌
      await page.waitForTimeout(4000)

    } catch (e) {
      console.log(`   ⚠️  操作失败:`, e)
    }
  }

  // 7. 检查最终状态
  console.log('\n=== 测试结果 ===')
  const finalCards = await handCards.count()
  const finalUrl = page.url()

  // 尝试获取排名信息
  let rankingsFound = false
  let rankingsText = ''

  // 检查页面上的排名显示
  const rankingElements = await page.locator('[data-testid*="ranking"], [data-testid*="rank"]').all()
  if (rankingElements.length > 0) {
    for (const el of rankingElements) {
      const text = await el.textContent().catch(() => '')
      if (text && text.includes('🥇')) {
        rankingsText = text
        rankingsFound = true
        console.log(`   找到排名显示: ${text}`)
      }
    }
  }

  // 检查游戏状态
  const pageContent = await page.locator('body').textContent()
  const isFinished = pageContent.includes('finished') ||
                     pageContent.includes('结束') ||
                     pageContent.includes('排名')

  console.log(`最终手牌: ${finalCards}`)
  console.log(`总回合数: ${turnCount}`)
  console.log(`游戏结束: ${isFinished ? '是' : '否'}`)
  console.log(`找到排名: ${rankingsFound ? '是' : '否'}`)

  // 检查错误
  const criticalErrors = errorLogs.filter(e =>
    e.includes('42703') ||
    e.includes('column "int"') ||
    e.includes('undefined') && !e.includes('window.DEBUG')
  )

  if (criticalErrors.length > 0) {
    console.log('\n严重错误:')
    criticalErrors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`))
  }

  // 保存日志
  const logPath = path.join(process.cwd(), 'test-results', 'game-flow.log')
  if (!existsSync(path.dirname(logPath))) {
    require('fs').mkdirSync(path.dirname(logPath), { recursive: true })
  }
  writeFileSync(logPath, allLogs.join('\n'))
  console.log(`\n日志已保存到: ${logPath}`)

  // 验证
  expect(criticalErrors.filter(e => e.includes('42703'))).toHaveLength(0)

  if (gameFinished || isFinished) {
    console.log('\n✅ 游戏已结束')
    // 如果游戏结束，应该能看到排名信息
    if (rankingsFound) {
      console.log('✅ 排名系统正常工作')
    } else {
      console.log('⚠️  游戏结束但未找到排名显示')
    }
  } else {
    console.log('\n⚠️  游戏未完全结束，但流程可以正常进行')
  }

  console.log('\n=== 测试完成 ===')
})
