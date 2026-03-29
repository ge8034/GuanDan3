import { test, expect } from '@playwright/test'

/**
 * 完整掼蛋游戏测试 - 捕获 AI 出牌日志
 */

test.describe('AI 出牌规则验证', () => {
  let capturedLogs: string[] = []

  test.beforeEach(async ({ page }) => {
    capturedLogs = []

    // 捕获控制台日志
    page.on('console', msg => {
      const text = msg.text()
      const type = msg.type()

      // 捕获 AI 相关日志
      if (text.includes('[AI]') ||
          text.includes('[useRoomAI]') ||
          text.includes('decideMove') ||
          text.includes('canBeat') ||
          text.includes('findOptimalMove')) {
        capturedLogs.push(`[${type.toUpperCase()}] ${text}`)
        console.log(`[Captured] [${type.toUpperCase()}] ${text}`)
      }

      // 捕获错误
      if (type === 'error') {
        capturedLogs.push(`[ERROR] ${text}`)
        console.error('[Browser ERROR]', text)
      }
    })

    // 捕获网络请求
    page.on('request', request => {
      const url = request.url()
      if (url.includes('submit_turn')) {
        console.log('[API] submit_turn 请求')
      }
    })

    // 捕获网络响应
    page.on('response', async response => {
      const url = response.url()
      if (url.includes('submit_turn')) {
        const body = await response.text()
        console.log('[API] submit_turn 响应:', response.status(), body.slice(0, 200))
      }
    })
  })

  test('验证 AI 遵循掼蛋出牌规则', async ({ page }) => {
    console.log('===== 开始 AI 规则验证测试 =====')

    // 1. 访问首页并开始练习
    console.log('\n[步骤 1] 创建练习房间')
    await page.goto('http://localhost:3000')
    await page.waitForLoadState('domcontentloaded')

    const practiceBtn = page.locator('button').filter({ hasText: /开始练习/i }).first()
    await practiceBtn.click()
    console.log('✓ 点击练习按钮')

    // 2. 等待跳转到游戏房间
    await page.waitForURL(/\/room\//, { timeout: 15000 })
    console.log('✓ 进入游戏房间')

    // 3. 等待游戏开始（自动开始）
    console.log('\n[步骤 2] 等待游戏自动开始')
    await page.waitForTimeout(5000)

    // 4. 检查手牌是否加载
    console.log('\n[步骤 3] 检查手牌')

    const handCards = await page.locator('[class*="HandArea"] button').count()
    console.log(`  手牌数量: ${handCards}`)

    if (handCards === 0) {
      console.log('  ⚠️ 手牌未加载，等待更长时间...')
      await page.waitForTimeout(5000)

      // 再次检查
      const retryCards = await page.locator('[class*="HandArea"] button').count()
      console.log(`  重试后手牌数量: ${retryCards}`)
    }

    // 5. 捕获几轮 AI 出牌
    console.log('\n[步骤 4] 观察 AI 出牌（10轮）')

    for (let round = 1; round <= 10; round++) {
      console.log(`\n  === 第 ${round} 轮 ===`)

      // 等待出牌完成
      await page.waitForTimeout(3000)

      // 检查是否是我的回合
      const isMyTurn = await page.evaluate(() => {
        return typeof window !== 'undefined' &&
               (window as any).currentSeat === (window as any).mySeat
      })

      if (isMyTurn) {
        console.log(`  我的回合！出一张小牌`)

        // 获取手牌并点击第一张
        const cards = await page.locator('[class*="HandArea"] button').all()
        if (cards.length > 0) {
          await cards[0].click()
          await page.waitForTimeout(300)

          // 找出牌按钮
          const playBtn = page.locator('button').filter({ hasText: /出牌/i }).first()
          if (await playBtn.isVisible()) {
            await playBtn.click()
            console.log(`  ✓ 出牌成功`)
          }
        }
      } else {
        console.log(`  AI 的回合`)
      }

      // 小延迟让 AI 完成
      await page.waitForTimeout(1000)
    }

    // 6. 分析日志
    console.log('\n[步骤 5] 分析 AI 出牌日志')

    // 查找问题模式
    const problems: string[] = []
    const aiMoves: string[] = []

    capturedLogs.forEach(log => {
      // 检查 AI 出牌
      if (log.includes('AI') && log.includes('决策完成')) {
        aiMoves.push(log)
      }

      // 检查炸弹
      if (log.includes('bomb') || log.includes('炸弹')) {
        console.log(`  [炸弹] ${log}`)
      }

      // 检查是否开局出炸弹
      if (log.includes('leading') && log.includes('bomb')) {
        problems.push('AI 领出时考虑炸弹')
      }

      // 检查 canBeat 结果
      if (log.includes('canBeat=true')) {
        console.log(`  [通过] ${log}`)
      } else if (log.includes('canBeat=false')) {
        problems.push(`AI 试图出不符合规则的牌: ${log}`)
      }
    })

    // 7. 输出分析结果
    console.log('\n===== 测试结果 =====')
    console.log(`捕获日志数量: ${capturedLogs.length}`)
    console.log(`AI 决策次数: ${aiMoves.length}`)
    console.log(`发现问题数量: ${problems.length}`)

    if (problems.length > 0) {
      console.log('\n发现的问题:')
      problems.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p}`)
      })
    } else {
      console.log('\n✓ 没有发现明显问题')
    }

    // 8. 保存日志到文件
    const logContent = capturedLogs.join('\n')
    const fs = require('fs')
    const path = require('path')
    const logFile = path.join(process.cwd(), 'test-results', 'ai-logs.txt')

    try {
      fs.mkdirSync(path.dirname(logFile), { recursive: true })
      fs.writeFileSync(logFile, logContent, 'utf-8')
      console.log(`\n日志已保存到: ${logFile}`)
    } catch (e) {
      console.log(`无法保存日志: ${e}`)
    }
  })
})
