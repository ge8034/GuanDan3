import { test, expect } from '@playwright/test'

test('详细错误捕获：出牌并记录完整错误', async ({ page }) => {
  // 捕获所有控制台日志
  const allLogs: any[] = []
  page.on('console', msg => {
    allLogs.push({ type: msg.type(), text: msg.text() })
    if (msg.text().includes('ERROR') || msg.text().includes('Submit turn')) {
      console.log(`[Console ${msg.type()}] ${msg.text()}`)
    }
  })

  // 监听网络请求
  const rpcCalls: any[] = []
  page.route('**/rest/v1/rpc/submit_turn', async route => {
    const request = route.request()
    const postData = request.postDataJSON()
    rpcCalls.push({ url: request.url(), body: postData })

    // 继续请求并捕获响应
    const response = await route.continue()
    const body = await response.body()
    try {
      const jsonBody = JSON.parse(body.toString())
      console.log('\n=== submit_turn RPC 调用 ===')
      console.log('请求:', JSON.stringify(postData, null, 2))
      console.log('响应:', JSON.stringify(jsonBody, null, 2))
      console.log('==========================\n')
    } catch (e) {
      console.log('响应解析失败:', body.toString())
    }
  })

  // 访问首页
  await page.goto('http://localhost:3000')
  await page.waitForLoadState('networkidle')
  console.log('1. ✓ 已访问首页')

  // 检查练习按钮 - 使用 data-testid
  const practiceButton = page.getByTestId('home-practice')
  await practiceButton.waitFor({ state: 'visible', timeout: 15000 })
  console.log('2. ✓ 练习按钮可见')

  // 点击开始练习
  await practiceButton.click()
  console.log('3. ✓ 已点击开始练习')

  // 等待进入房间
  await page.waitForURL(/\/room\//, { timeout: 10000 })
  const url = page.url()
  const roomIdMatch = url.match(/\/room\/([^/]+)/)
  const roomId = roomIdMatch ? roomIdMatch[1] : 'unknown'
  console.log(`4. ✓ 已进入房间，ID: ${roomId}`)

  // 等待游戏自动开始
  await page.waitForTimeout(3000)
  console.log('5. ✓ 等待游戏自动开始')

  // 检查手牌数量
  const handCards = page.locator('[data-testid="hand-card"]')
  const count = await handCards.count()
  console.log(`6. ✓ 手牌数量: ${count}`)
  expect(count).toBe(27)

  // 点击第一张牌
  await handCards.first().click()
  console.log('7. ✓ 已选择第一张牌')

  // 点击出牌按钮
  const playButton = page.getByRole('button', { name: /出牌/i })
  await expect(playButton).toBeEnabled()
  await playButton.click()
  console.log('8. ✓ 已点击出牌按钮')

  // 等待游戏处理
  await page.waitForTimeout(3000)

  // 检查新手牌数量
  const newCount = await handCards.count()
  console.log(`9. 新手牌数量: ${newCount}`)
  console.log(`   变化: ${count} → ${newCount}`)

  // 打印所有 RPC 调用
  console.log('\n=== 所有 RPC 调用 ===')
  rpcCalls.forEach((call, i) => {
    console.log(`RPC ${i + 1}:`, JSON.stringify(call.body, null, 2))
  })

  // 打印所有错误日志
  console.log('\n=== 所有控制台日志 ===')
  allLogs.forEach(log => {
    if (log.type === 'error') {
      console.log(`[${log.type}] ${log.text}`)
    }
  })

  expect(newCount).toBeLessThan(count)
})
