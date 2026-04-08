import { test, expect } from '@playwright/test'

/**
 * 视觉回归测试
 *
 * 用于验证UI组件的视觉效果，防止样式回退
 * 运行: npm run test:e2e tests/visual-regression.spec.ts
 */

// 页面URL配置
const PAGES = {
  lobby: '/lobby',
  friends: '/friends',
  history: '/history',
  profile: '/profile',
  designSystem: '/design-system',
}

describe('视觉回归测试', () => {
  // 设置视口大小
  const viewports = [
    { width: 1280, height: 720 },  // 桌面
    { width: 768, height: 1024 },  // 平板
    { width: 375, height: 667 },   // 移动
  ]

  describe('主页面截图对比', () => {
    test.beforeEach(async ({ page }) => {
      // 等待页面稳定
      page.waitForLoadState('networkidle')
      page.waitForTimeout(500)
    })

    test('Lobby页面 - 桌面视图', async ({ page }) => {
      await page.goto(PAGES.lobby)

      // 等待房间卡片加载
      await page.waitForSelector('[data-testid="room-card"]', { timeout: 5000 })

      // 截图对比
      await expect(page).toHaveScreenshot('lobby-desktop.png', {
        maxDiffPixels: 100,
        threshold: 0.2,
      })
    })

    test('Friends页面 - 桌面视图', async ({ page }) => {
      await page.goto(PAGES.friends)

      // 等待好友列表加载
      await page.waitForSelector('[data-testid="friends-list"]', { timeout: 5000 })

      await expect(page).toHaveScreenshot('friends-desktop.png', {
        maxDiffPixels: 100,
        threshold: 0.2,
      })
    })

    test('History页面 - 桌面视图', async ({ page }) => {
      await page.goto(PAGES.history)

      await page.waitForSelector('[data-testid="history-list"]', { timeout: 5000 })

      await expect(page).toHaveScreenshot('history-desktop.png', {
        maxDiffPixels: 100,
        threshold: 0.2,
      })
    })

    test('Profile页面 - 桌面视图', async ({ page }) => {
      await page.goto(PAGES.profile)

      await page.waitForSelector('[data-testid="profile-stats"]', { timeout: 5000 })

      await expect(page).toHaveScreenshot('profile-desktop.png', {
        maxDiffPixels: 100,
        threshold: 0.2,
      })
    })

    test('Design System页面 - 桌面视图', async ({ page }) => {
      await page.goto(PAGES.designSystem)

      await page.waitForSelector('text=富春山居图设计系统', { timeout: 5000 })

      await expect(page).toHaveScreenshot('design-system-desktop.png', {
        maxDiffPixels: 150,
        threshold: 0.25,
      })
    })
  })

  describe('响应式布局测试', () => {
    test('Lobby页面 - 响应式视图', async ({ page }) => {
      await page.goto(PAGES.lobby)
      await page.waitForSelector('[data-testid="room-card"]', { timeout: 5000 })

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.waitForTimeout(300)

        const viewportName = viewport.width >= 1280 ? 'desktop' :
                              viewport.width >= 768 ? 'tablet' : 'mobile'

        await expect(page).toHaveScreenshot(`lobby-${viewportName}.png`, {
          maxDiffPixels: 100,
          threshold: 0.2,
        })
      }
    })

    test('Profile页面 - 响应式视图', async ({ page }) => {
      await page.goto(PAGES.profile)
      await page.waitForSelector('[data-testid="profile-stats"]', { timeout: 5000 })

      for (const viewport of viewports) {
        await page.setViewportSize(viewport)
        await page.waitForTimeout(300)

        const viewportName = viewport.width >= 1280 ? 'desktop' :
                              viewport.width >= 768 ? 'tablet' : 'mobile'

        await expect(page).toHaveScreenshot(`profile-${viewportName}.png`, {
          maxDiffPixels: 100,
          threshold: 0.2,
        })
      }
    })
  })

  describe('组件状态截图', () => {
    test('按钮组件状态', async ({ page }) => {
      await page.goto(PAGES.designSystem)

      // 点击"UI组件"标签
      await page.click('text=UI组件')
      await page.waitForTimeout(300)

      // 截取按钮区域
      const buttonSection = page.locator('text=按钮').locator('..').locator('..').first()
      await expect(buttonSection).toHaveScreenshot('button-states.png', {
        maxDiffPixels: 50,
        threshold: 0.15,
      })
    })

    test('卡片组件状态', async ({ page }) => {
      await page.goto(PAGES.designSystem)

      await page.click('text=UI组件')
      await page.waitForTimeout(300)

      const cardSection = page.locator('text=卡片').locator('..').locator('..').first()
      await expect(cardSection).toHaveScreenshot('card-states.png', {
        maxDiffPixels: 50,
        threshold: 0.15,
      })
    })

    test('骨架屏组件', async ({ page }) => {
      await page.goto(PAGES.designSystem)

      await page.click('text=骨架屏')
      await page.waitForTimeout(300)

      const skeletonSection = page.locator('.bg-beige\\/30').first()
      await expect(skeletonSection).toHaveScreenshot('skeleton-components.png', {
        maxDiffPixels: 80,
        threshold: 0.2,
      })
    })
  })

  describe('交互状态测试', () => {
    test.use({ storageState: { cookies: [], origins: [] } })

    test('按钮悬停状态', async ({ page }) => {
      await page.goto(PAGES.designSystem)
      await page.click('text=UI组件')

      const button = page.locator('button:has-text("主要")').first()
      await button.hover()
      await page.waitForTimeout(200)

      await expect(button).toHaveScreenshot('button-hover.png')
    })

    test('按钮聚焦状态', async ({ page }) => {
      await page.goto(PAGES.designSystem)
      await page.click('text=UI组件')

      const button = page.locator('button:has-text("主要")').first()
      await button.focus()
      await page.waitForTimeout(200)

      await expect(button).toHaveScreenshot('button-focus.png')
    })
  })
})

/**
 * 使用说明：
 *
 * 1. 运行测试：
 *    npx playwright test tests/visual-regression.spec.ts
 *
 * 2. 更新截图（当UI有意改动时）：
 *    npx playwright test tests/visual-regression.spec.ts --update-snapshots
 *
 * 3. 只运行特定测试：
 *    npx playwright test tests/visual-regression.spec.ts -g "Lobby页面"
 *
 * 4. 查看截图报告：
 *    npx playwright show-report
 */
