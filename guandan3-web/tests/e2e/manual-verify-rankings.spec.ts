/**
 * 手动验证排名显示
 * 直接访问已创建的游戏房间
 */

import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const ROOM_ID = '9d8dfecb-740e-415e-80d6-15d30495c66d'

test('手动验证排名显示', async ({ page }) => {
  console.log('=== 手动验证排名显示 ===\n')
  console.log(`访问房间: ${BASE_URL}/room/${ROOM_ID}\n`)

  const allLogs: string[] = []

  page.on('console', msg => {
    const text = msg.text()
    allLogs.push(text)
    if (text.includes('ERROR') || text.includes('rankings') || text.includes('排名') || text.includes('fetchGame') || text.includes('finished')) {
      console.log(`[Console] ${text}`)
    }
  })

  // 访问页面
  await page.goto(`${BASE_URL}/room/${ROOM_ID}`, { waitUntil: 'domcontentloaded' })

  // 等待加载
  console.log('等待页面加载...')
  await page.waitForTimeout(10000)

  // 检查页面内容
  const pageContent = await page.locator('body').textContent()
  console.log(`\n页面文本长度: ${pageContent?.length || 0}`)

  // 检查 GameOverOverlay
  const gameOverOverlay = page.locator('[data-testid="game-over-overlay"]')
  const overlayExists = await gameOverOverlay.count() > 0
  console.log(`GameOverOverlay 存在: ${overlayExists}`)

  if (overlayExists) {
    const overlayText = await gameOverOverlay.textContent()
    console.log(`\n覆盖层内容:\n${overlayText}`)

    const rankingItems = await gameOverOverlay.locator('[data-testid^="ranking-"]').all()
    console.log(`\n排名项数量: ${rankingItems.length}`)
    for (let i = 0; i < rankingItems.length; i++) {
      const text = await rankingItems[i].textContent()
      console.log(`  ${i + 1}. ${text}`)
    }
  }

  // 检查排名元素
  const hasCrown = await page.locator('*:has-text("👑")').count() > 0
  const hasRankingText = await page.locator('*:has-text("头游"), *:has-text("二游"), *:has-text("三游")').count() > 0

  console.log(`\n👑 图标: ${hasCrown ? '存在' : '不存在'}`)
  console.log(`排名文字: ${hasRankingText ? '存在' : '不存在'}`)

  // 截图
  await page.screenshot({ path: 'test-results/rankings-display-screenshot.png' })
  console.log('\n截图已保存: test-results/rankings-display-screenshot.png')

  // 检查错误
  const elemErrors = allLogs.filter(e => e.includes('42703') || e.includes('column "elem"'))
  if (elemErrors.length > 0) {
    console.log('\n❌ 发现 42703 错误:')
    elemErrors.forEach(e => console.log(`  ${e}`))
  } else {
    console.log('\n✅ 无 42703 错误')
  }

  // 验证
  expect(elemErrors).toHaveLength(0)

  if (overlayExists && (hasCrown || hasRankingText)) {
    console.log('\n✅ 排名显示验证成功！')
  } else {
    console.log('\n⚠️  排名显示未找到')
  }

  console.log('\n=== 测试完成 ===')
})
