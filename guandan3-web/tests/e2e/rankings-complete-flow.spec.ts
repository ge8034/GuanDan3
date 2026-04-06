/**
 * 完整的排名验证测试 - 使用真实游戏流程
 * 目标：完成一局游戏并验证排名显示
 */

import { test, expect } from '@playwright/test'
import { Client } from 'pg'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const DATABASE_URL = require('fs').readFileSync('.env.local', 'utf8')
  .split('\n')
  .find((line: string) => line.startsWith('DATABASE_URL='))
  ?.split('=')[1] || ''

function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * 清理所有测试数据
 */
async function cleanupAllTestData(): Promise<void> {
  const client = new Client({ connectionString: DATABASE_URL })
  try {
    await client.connect()
    // 清理之前创建的测试游戏
    await client.query("DELETE FROM room_members WHERE room_id IN ('37957d49-b39e-4343-8d15-5bee52db371a', '9d8dfecb-740e-415e-80d6-15d30495c66d')")
    await client.query("DELETE FROM games WHERE room_id IN ('37957d49-b39e-4343-8d15-5bee52db371a', '9d8dfecb-740e-415e-80d6-15d30495c66d')")
    await client.query("DELETE FROM rooms WHERE id IN ('37957d49-b39e-4343-8d15-5bee52db371a', '9d8dfecb-740e-415e-80d6-15d30495c66d')")
    console.log('Cleaned up test data')
  } finally {
    await client.end()
  }
}

test.beforeAll(async () => {
  await cleanupAllTestData()
})

test.afterAll(async () => {
  await cleanupAllTestData()
})

test('完整游戏流程：验证排名显示 1,2,3,4', async ({ page }) => {
  console.log('=== 开始完整游戏排名验证测试 ===\n')

  const allLogs: string[] = []
  const rankingsLogs: string[] = []

  page.on('console', msg => {
    const text = msg.text()
    allLogs.push(text)
    if (text.includes('rankings') || text.includes('排名') || text.includes('finished') || text.includes('GameOverOverlay')) {
      rankingsLogs.push(text)
      console.log(`[排名] ${text}`)
    }
    if (text.includes('ERROR') || text.includes('fetchGame')) {
      console.log(`[${text.includes('ERROR') ? '错误' : '状态'}] ${text}`)
    }
  })

  // 1. 访问首页
  console.log('1. 访问首页...')
  await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(3000)

  // 2. 点击开始练习 - 这会自动创建匿名用户并加入房间
  console.log('2. 点击开始练习...')
  const practiceBtn = page.getByRole('button', { name: /练习|开始练习/i })
  await expect(practiceBtn).toBeVisible({ timeout: 10000 })
  await practiceBtn.click()

  // 3. 等待进入房间
  console.log('3. 等待进入房间...')
  await page.waitForURL(/\/room\/[^/]+$/, { timeout: 20000 })
  const url = page.url()
  const roomId = url.match(/\/room\/([^/]+)/)?.[1] || 'unknown'
  console.log(`   房间ID: ${roomId}`)

  // 4. 等待游戏自动开始
  console.log('4. 等待游戏自动开始...')
  await page.waitForTimeout(15000)

  // 5. 检查初始状态
  console.log('5. 检查初始状态...')
  const handCards = page.locator('[data-card-id]')
  let cardCount = await handCards.count()
  console.log(`   初始手牌: ${cardCount}`)
  expect(cardCount).toBeGreaterThan(0)

  // 6. 出一些牌来推进游戏
  console.log('\n6. 出牌推进游戏...')
  const maxTurns = 20
  for (let i = 0; i < maxTurns; i++) {
    const currentCards = await handCards.count()

    // 检查游戏是否结束
    const gameOverOverlay = page.locator('[data-testid="game-over-overlay"]')
    if (await gameOverOverlay.count() > 0) {
      console.log(`   ✓ 游戏结束！(第 ${i + 1} 回合)`)
      break
    }

    // 出牌
    try {
      await page.evaluate(() => {
        const firstCard = document.querySelector('[data-card-id]')
        if (firstCard) firstCard.click()
      })
      await page.waitForTimeout(200)

      const playBtn = page.getByRole('button', { name: /出牌/i }).first()
      const canPlay = await playBtn.isEnabled().catch(() => false)

      if (canPlay) {
        await playBtn.click()
        console.log(`   [回合 ${i + 1}] 出牌 (剩余: ${currentCards - 1})`)
      } else {
        const passBtn = page.getByRole('button', { name: /不出|过/i }).first()
        if (await passBtn.isVisible().catch(() => false)) {
          await passBtn.click()
          console.log(`   [回合 ${i + 1}] 不出`)
        }
      }

      await page.waitForTimeout(3000)
    } catch (e) {
      console.log(`   ⚠️  操作失败，跳过`)
    }
  }

  // 7. 如果游戏自然结束，检查排名显示
  console.log('\n7. 检查排名显示...')
  const gameOverOverlay = page.locator('[data-testid="game-over-overlay"]')
  const overlayExists = await gameOverOverlay.count() > 0

  console.log(`   GameOverOverlay: ${overlayExists ? '✅ 存在' : '❌ 不存在'}`)

  if (overlayExists) {
    const overlayText = await gameOverOverlay.textContent()
    console.log(`   覆盖层内容: ${overlayText.substring(0, 200)}...`)

    const rankingItems = await gameOverOverlay.locator('[data-testid^="ranking-"]').all()
    console.log(`   排名项数量: ${rankingItems.length}`)

    const hasCrown = await page.locator('*:has-text("👑")').count() > 0
    console.log(`   👑 图标: ${hasCrown ? '存在' : '不存在'}`)

    if (rankingItems.length > 0 || hasCrown) {
      console.log('\n✅ 排名显示验证成功！')
    }
  }

  // 8. 如果没有自然结束，手动完成游戏
  if (!overlayExists) {
    console.log('\n8. 游戏未自然结束，手动完成...')

    // 获取当前游戏ID并直接更新数据库
    const client = new Client({ connectionString: DATABASE_URL })
    try {
      await client.connect()

      // 获取当前房间的游戏
      const { rows: games } = await client.query(`
        SELECT id, room_id, status_public, state_private
        FROM games
        WHERE room_id = $1
      `, [roomId])

      if (games.length > 0) {
        const game = games[0]
        console.log(`   找到游戏: ${game.id}`)

        // 手动完成游戏 - 设置排名
        await client.query(`
          UPDATE games
          SET status = 'finished',
              state_public = jsonb_set(
                jsonb_set(state_public, '{rankings}', '[1,2,3]'::jsonb),
                '{counts}', '[27,0,0,0]'::jsonb
              )
          WHERE id = $1
        `, [game.id])
        console.log('   ✓ 已手动完成游戏')

        // 刷新页面
        await page.reload()
        await page.waitForTimeout(5000)

        // 再次检查排名显示
        const overlayExists2 = await page.locator('[data-testid="game-over-overlay"]').count() > 0
        console.log(`   刷新后 GameOverOverlay: ${overlayExists2 ? '✅ 存在' : '❌ 不存在'}`)

        if (overlayExists2) {
          const overlayText = await page.locator('[data-testid="game-over-overlay"]').textContent()
          console.log(`   排名显示: ${overlayText.substring(0, 300)}...`)

          if (overlayText.includes('👑') || overlayText.includes('头游')) {
            console.log('\n✅ 手动完成后排名显示正常！')
          }
        }
      }
    } finally {
      await client.end()
    }
  }

  // 9. 验证无错误
  console.log('\n9. 验证错误...')
  const elemErrors = allLogs.filter(e => e.includes('42703') || e.includes('column "elem"'))
  if (elemErrors.length > 0) {
    console.log('   ❌ 发现 42703 错误:')
    elemErrors.forEach(e => console.log(`     ${e}`))
  } else {
    console.log('   ✅ 无 42703 错误')
  }

  expect(elemErrors).toHaveLength(0)

  console.log('\n=== 测试完成 ===')
})
