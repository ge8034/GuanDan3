import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { chromium, Browser, Page, BrowserContext } from 'playwright'

describe('用户流程E2E测试', () => {
  let browser: Browser
  let context: BrowserContext
  let page: Page

  beforeAll(async () => {
    browser = await chromium.launch()
    context = await browser.newContext()
    page = await context.newPage()
  })

  afterAll(async () => {
    await context.close()
    await browser.close()
  })

  describe('用户注册流程', () => {
    it('应该能够完成用户注册', async () => {
      await page.goto('http://localhost:3000/register')

      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="username"]', 'testuser')
      await page.fill('input[name="password"]', 'SecurePass123')
      await page.fill('input[name="confirmPassword"]', 'SecurePass123')

      await page.click('button[type="submit"]')

      await page.waitForURL('**/dashboard')
      expect(page.url()).toContain('dashboard')
    })

    it('应该能够验证注册表单', async () => {
      await page.goto('http://localhost:3000/register')

      await page.click('button[type="submit"]')

      const emailError = await page.textContent('input[name="email"] + .error')
      const passwordError = await page.textContent('input[name="password"] + .error')

      expect(emailError).toBeTruthy()
      expect(passwordError).toBeTruthy()
    })
  })

  describe('用户登录流程', () => {
    it('应该能够完成用户登录', async () => {
      await page.goto('http://localhost:3000/login')

      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'SecurePass123')

      await page.click('button[type="submit"]')

      await page.waitForURL('**/dashboard')
      expect(page.url()).toContain('dashboard')
    })

    it('应该能够处理登录失败', async () => {
      await page.goto('http://localhost:3000/login')

      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="password"]', 'WrongPassword')

      await page.click('button[type="submit"]')

      const errorMessage = await page.textContent('.error-message')
      expect(errorMessage).toBeTruthy()
    })
  })

  describe('房间创建流程', () => {
    it('应该能够创建新房间', async () => {
      await page.goto('http://localhost:3000/dashboard')

      await page.click('button:has-text("创建房间")')

      await page.fill('input[name="roomName"]', '测试房间')
      await page.selectOption('select[name="maxPlayers"]', '4')
      await page.selectOption('select[name="gameMode"]', 'standard')

      await page.click('button:has-text("创建")')

      await page.waitForURL('**/room/**')
      expect(page.url()).toContain('/room/')
    })

    it('应该能够设置房间选项', async () => {
      await page.goto('http://localhost:3000/dashboard')

      await page.click('button:has-text("创建房间")')

      await page.fill('input[name="roomName"]', '高级房间')
      await page.selectOption('select[name="maxPlayers"]', '6')
      await page.selectOption('select[name="gameMode"]', 'advanced')
      await page.check('input[name="allowSpectators"]')
      await page.check('input[name="enableChat"]')

      await page.click('button:has-text("创建")')

      await page.waitForURL('**/room/**')
      expect(page.url()).toContain('/room/')
    })
  })

  describe('房间加入流程', () => {
    it('应该能够加入现有房间', async () => {
      await page.goto('http://localhost:3000/lobby')

      const roomCard = page.locator('.room-card').first()
      await roomCard.click()

      await page.click('button:has-text("加入房间")')

      await page.waitForURL('**/room/**')
      expect(page.url()).toContain('/room/')
    })

    it('应该能够搜索房间', async () => {
      await page.goto('http://localhost:3000/lobby')

      await page.fill('input[placeholder="搜索房间"]', '测试房间')
      await page.press('input[placeholder="搜索房间"]', 'Enter')

      const searchResults = await page.locator('.room-card').count()
      expect(searchResults).toBeGreaterThan(0)
    })
  })

  describe('游戏流程', () => {
    it('应该能够开始游戏', async () => {
      await page.goto('http://localhost:3000/room/test-room')

      await page.click('button:has-text("开始游戏")')

      const gameStatus = await page.textContent('.game-status')
      expect(gameStatus).toContain('游戏中')
    })

    it('应该能够出牌', async () => {
      await page.goto('http://localhost:3000/room/test-room')

      const card = page.locator('.card').first()
      await card.click()

      await page.click('button:has-text("出牌")')

      const playedCards = await page.locator('.played-cards .card').count()
      expect(playedCards).toBeGreaterThan(0)
    })

    it('应该能够过牌', async () => {
      await page.goto('http://localhost:3000/room/test-room')

      await page.click('button:has-text("过牌")')

      const passMessage = await page.textContent('.game-message')
      expect(passMessage).toContain('过牌')
    })
  })

  describe('聊天功能', () => {
    it('应该能够发送聊天消息', async () => {
      await page.goto('http://localhost:3000/room/test-room')

      await page.fill('input[placeholder="输入消息"]', '你好！')
      await page.press('input[placeholder="输入消息"]', 'Enter')

      const chatMessages = await page.locator('.chat-message').count()
      expect(chatMessages).toBeGreaterThan(0)
    })

    it('应该能够接收聊天消息', async () => {
      await page.goto('http://localhost:3000/room/test-room')

      const initialCount = await page.locator('.chat-message').count()

      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('chat-message', {
          detail: { message: '测试消息', user: '其他玩家' }
        }))
      })

      await page.waitForTimeout(1000)

      const finalCount = await page.locator('.chat-message').count()
      expect(finalCount).toBeGreaterThan(initialCount)
    })
  })

  describe('设置功能', () => {
    it('应该能够访问设置页面', async () => {
      await page.goto('http://localhost:3000/dashboard')

      await page.click('button:has-text("设置")')

      await page.waitForURL('**/settings')
      expect(page.url()).toContain('settings')
    })

    it('应该能够更新用户设置', async () => {
      await page.goto('http://localhost:3000/settings')

      await page.fill('input[name="username"]', 'newusername')
      await page.fill('input[name="email"]', 'newemail@example.com')

      await page.click('button:has-text("保存")')

      const successMessage = await page.textContent('.success-message')
      expect(successMessage).toBeTruthy()
    })
  })

  describe('登出流程', () => {
    it('应该能够登出', async () => {
      await page.goto('http://localhost:3000/dashboard')

      await page.click('button:has-text("登出")')

      await page.waitForURL('**/login')
      expect(page.url()).toContain('login')
    })
  })

  describe('响应式设计', () => {
    it('应该在移动设备上正常显示', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('http://localhost:3000/dashboard')

      const mobileMenu = await page.isVisible('.mobile-menu')
      expect(mobileMenu).toBeTruthy()
    })

    it('应该在桌面设备上正常显示', async () => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await page.goto('http://localhost:3000/dashboard')

      const desktopMenu = await page.isVisible('.desktop-menu')
      expect(desktopMenu).toBeTruthy()
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内加载页面', async () => {
      const startTime = Date.now()
      await page.goto('http://localhost:3000/dashboard')
      const loadTime = Date.now() - startTime

      expect(loadTime).toBeLessThan(3000)
    })

    it('应该能够快速响应交互', async () => {
      await page.goto('http://localhost:3000/dashboard')

      const startTime = Date.now()
      await page.click('button:has-text("创建房间")')
      const responseTime = Date.now() - startTime

      expect(responseTime).toBeLessThan(500)
    })
  })
})
