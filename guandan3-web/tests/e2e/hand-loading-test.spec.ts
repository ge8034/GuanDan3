import { test, expect } from '@playwright/test'

test('手牌加载测试 - 验证游戏开始后玩家能收到手牌', async ({ page }) => {
  console.log('=== 步骤1: 访问首页 ===')
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  console.log('=== 步骤2: 创建练习房 ===')
  // 点击"开始练习"按钮
  const practiceButton = page.getByTestId('home-practice')
  await expect(practiceButton).toBeVisible()
  await practiceButton.click()

  console.log('=== 步骤3: 等待进入房间 ===')
  // 等待跳转到房间页面
  await page.waitForURL(/\/room\/[a-f0-9-]{8}-[a-f0-9-]{4}-[a-f0-9-]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)
  const url = page.url()
  const roomId = url.match(/room\/([a-f0-9-]+)/)?.[1]
  console.log(`房间ID: ${roomId}`)

  console.log('=== 步骤4: 等待游戏自动开始 ===')

  // 等待座位信息加载
  await page.waitForSelector('[data-testid="player-seat-0"]', { timeout: 10000 })
  console.log('✓ 座位信息已加载')

  // 等待手牌区域出现
  console.log('等待手牌区域...')

  // 等待游戏状态从 deal 变为 playing
  let retries = 0
  while (retries < 20) {
    const gameStatus = await page.evaluate(() => {
      const logs = (window as any).consoleLogs || []
      const statusLog = logs.filter((l: string) => l.includes('gameStatus='))
      if (statusLog.length > 0) {
        const match = statusLog[statusLog.length - 1].match(/gameStatus=(\w+)/)
        return match ? match[1] : null
      }
      return null
    })

    console.log(`当前游戏状态: ${gameStatus || 'unknown'}`)

    if (gameStatus === 'playing') {
      break
    }

    await page.waitForTimeout(1000)
    retries++
  }

  console.log('=== 步骤5: 验证手牌加载 ===')

  // 检查手牌数量
  const handCount = await page.evaluate(() => {
    const handCards = document.querySelectorAll('[data-card-id]')
    return handCards.length
  })

  console.log(`初始手牌数量: ${handCount}`)

  if (handCount === 0) {
    console.log('手牌数量为0，等待额外10秒...')
    await page.waitForTimeout(10000)

    const retryCount = await page.evaluate(() => {
      const handCards = document.querySelectorAll('[data-card-id]')
      return handCards.length
    })

    console.log(`重试后手牌数量: ${retryCount}`)
  }

  // 输出调试信息
  const debugInfo = await page.evaluate(() => {
    const logs = (window as any).consoleLogs || []
    return {
      totalLogs: logs.length,
      recentLogs: logs.slice(-20),
      gameStoreState: (window as any).DEBUG?.useGameStore?.getState?.()
    }
  })

  console.log('=== 调试信息 ===')
  console.log('总日志数:', debugInfo.totalLogs)
  console.log('最近日志:', debugInfo.recentLogs)
  console.log('游戏状态:', JSON.stringify(debugInfo.gameStoreState, null, 2))

  // 断言手牌数量大于0
  expect(handCount).toBeGreaterThan(0)
})
