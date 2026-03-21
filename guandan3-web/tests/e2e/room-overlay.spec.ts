import { test, expect, chromium } from '@playwright/test'

test.describe('房间覆盖层', () => {
  test.setTimeout(180000)

  test('房间不存在时提供可恢复操作', async ({ page }) => {
    await page.goto(`http://localhost:3000/room/not-exists-${Date.now()}`, { timeout: 30000 })
    await expect(page.getByTestId('room-overlay-copy-link')).toBeVisible({ timeout: 90000 })
    await page.getByTestId('room-overlay-copy-link').click()
    await expect(page.getByTestId('toast-item').first()).toBeVisible({ timeout: 30000 })

    await page.getByTestId('room-overlay-back-lobby').evaluate(el => (el as HTMLElement).click())
    const lobbyHeading = page.locator('h1').filter({ hasText: '对战大厅' }).first();
    await expect(lobbyHeading).toBeVisible({ timeout: 60000 })
  })

  test('房间满员时显示满员覆盖层', async ({ page }) => {
    await page.goto('http://localhost:3000/lobby', { timeout: 30000 })
    const lobbyHeading = page.locator('h1').filter({ hasText: '对战大厅' }).first();
    await expect(lobbyHeading).toBeVisible({ timeout: 60000 })

    let created = false
    for (let attempt = 0; attempt < 2; attempt++) {
      const roomName = `RoomFull-${Date.now()}-${attempt}`
      await page.getByTestId('lobby-create-name').fill(roomName)
      await page.getByTestId('lobby-create').click()
      try {
        await page.waitForURL(/\/room\//, { timeout: 120000 })
        created = true
        break
      } catch {
        await page.goto('http://localhost:3000/lobby', { timeout: 30000 })
        const lobbyHeading = page.locator('h1').filter({ hasText: '对战大厅' }).first();
        await expect(lobbyHeading).toBeVisible({ timeout: 60000 })
      }
    }
    expect(created).toBe(true)

    const roomUrl = page.url()
    
    // 使用同一个浏览器实例，通过不同上下文模拟多用户
    const browser = await chromium.launch({ headless: true })
    
    try {
      // 模拟3个用户加入房间
      for (let i = 0; i < 3; i++) {
        const ctx = await browser.newContext()
        const p = await ctx.newPage()
        
        // 增加重试逻辑，确保加入成功
        await expect(async () => {
          await p.goto(roomUrl, { timeout: 30000 })
          // 等待加入按钮出现
          const joinBtn = p.getByRole('button', { name: '加入座位' })
          await expect(joinBtn).toBeVisible({ timeout: 10000 })
          // 点击加入
          await joinBtn.evaluate(el => (el as HTMLElement).click())
          // 确认加入成功（按钮消失）
          await expect(joinBtn).toBeHidden({ timeout: 10000 })
        }).toPass({
          intervals: [1000, 2000, 5000],
          timeout: 60000
        })
      }

      // 第4个用户（观察者）验证满员状态
      const vctx = await browser.newContext()
      const vp = await vctx.newPage()
      
      await expect(async () => {
        await vp.goto(roomUrl, { timeout: 30000 })
        await expect(vp.getByRole('heading', { name: '房间已满' })).toBeVisible({ timeout: 5000 })
      }).toPass({
        intervals: [1000, 2000],
        timeout: 45000
      })
      
      await expect(vp.getByTestId('room-overlay-back-lobby')).toBeVisible({ timeout: 10000 })
      await expect(vp.getByTestId('room-overlay-copy-link')).toBeVisible({ timeout: 10000 })
      await expect(vp.getByTestId('room-overlay-refresh')).toBeVisible({ timeout: 10000 })
      
    } finally {
      await browser.close()
    }
  })
})
