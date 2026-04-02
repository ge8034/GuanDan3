/**
 * E2E测试优化工具
 *
 * 提供智能等待和性能优化工具，减少测试超时
 */

import type { Page, Locator } from '@playwright/test'

/**
 * 配置常量
 */
export const TEST_TIMEOUTS = {
  FAST: 10000,      // 快速操作（点击、输入）
  NORMAL: 30000,    // 普通操作（页面导航、组件加载）
  SLOW: 60000,      // 慢速操作（AI决策、网络请求）
  GAME: 120000,     // 游戏流程（完整游戏）
  STRESS: 300000,   // 压力测试（长时间运行）
} as const

/**
 * 智能等待元素可见
 * 比固定等待更高效，避免不必要的等待时间
 *
 * @param locator - 元素定位器
 * @param options - 配置选项
 * @returns Promise<Locator> - 可见的元素
 */
export async function smartWaitVisible(
  locator: Locator,
  options: {
    timeout?: number
    fallbackTimeout?: number // 失败后的重试超时
  } = {}
): Promise<Locator> {
  const { timeout = TEST_TIMEOUTS.NORMAL, fallbackTimeout = TEST_TIMEOUTS.SLOW } = options

  try {
    await locator.waitFor({ state: 'visible', timeout })
    return locator
  } catch (error) {
    // 第一次尝试失败，使用更长的超时时间
    console.log(`[智能等待] 第一次超时，使用更长超时时间: ${fallbackTimeout}ms`)
    await locator.waitFor({ state: 'visible', timeout: fallbackTimeout })
    return locator
  }
}

/**
 * 智能等待网络空闲
 * 避免无限等待，设置合理的超时
 *
 * @param page - Playwright页面对象
 * @param options - 配置选项
 */
export async function smartWaitNetworkIdle(
  page: Page,
  options: {
    timeout?: number
  } = {}
): Promise<void> {
  const { timeout = TEST_TIMEOUTS.SLOW } = options

  try {
    await page.waitForLoadState('networkidle', timeout })
  } catch (error) {
    console.log('[智能等待] 网络未完全空闲，但继续执行')
  }
}

/**
 * 智能等待URL变化
 *
 * @param page - Playwright页面对象
 * @param urlPattern - URL模式
 * @param options - 配置选项
 */
export async function smartWaitURL(
  page: Page,
  urlPattern: RegExp | string,
  options: {
    timeout?: number
  } = {}
): Promise<string> {
  const { timeout = TEST_TIMEOUTS.NORMAL } = options

  await page.waitForURL(urlPattern, { timeout })
  return page.url()
}

/**
 * 批量等待多个元素
 * 优化并行等待，减少总等待时间
 *
 * @param locators - 元素定位器数组
 * @param options - 配置选项
 */
export async function waitAllVisible(
  locators: Locator[],
  options: {
    timeout?: number
  } = {}
): Promise<void> {
  const { timeout = TEST_TIMEOUTS.NORMAL } = options

  await Promise.all(
    locators.map(locator => locator.waitFor({ state: 'visible', timeout }))
  )
}

/**
 * 安全点击
 * 自动等待元素可点击并处理可能的失败
 *
 * @param locator - 元素定位器
 * @param options - 配置选项
 */
export async function safeClick(
  locator: Locator,
  options: {
    timeout?: number
    force?: boolean
    retry?: number
  } = {}
): Promise<boolean> {
  const { timeout = TEST_TIMEOUTS.FAST, force = false, retry = 2 } = options

  for (let i = 0; i < retry; i++) {
    try {
      await smartWaitVisible(locator, { timeout })
      await locator.click({ force })
      return true
    } catch (error) {
      if (i === retry - 1) {
        console.log(`[安全点击] 失败: ${error}`)
        return false
      }
      console.log(`[安全点击] 重试 ${i + 1}/${retry}`)
    }
  }

  return false
}

/**
 * 安全填充文本
 *
 * @param locator - 元素定位器
 * @param text - 要填写的文本
 * @param options - 配置选项
 */
export async function safeFill(
  locator: Locator,
  text: string,
  options: {
    timeout?: number
    clear?: boolean
  } = {}
): Promise<boolean> {
  const { timeout = TEST_TIMEOUTS.FAST, clear = true } = options

  try {
    await smartWaitVisible(locator, { timeout })
    if (clear) {
      await locator.clear()
    }
    await locator.fill(text)
    return true
  } catch (error) {
    console.log(`[安全填充] 失败: ${error}`)
    return false
  }
}

/**
 * 检查元素是否存在且可见
 * 不抛出异常，返回布尔值
 *
 * @param locator - 元素定位器
 * @param options - 配置选项
 */
export async function isElementVisible(
  locator: Locator,
  options: {
    timeout?: number
  } = {}
): Promise<boolean> {
  const { timeout = TEST_TIMEOUTS.FAST } = options

  try {
    await locator.waitFor({ state: 'visible', timeout })
    return true
  } catch {
    return false
  }
}

/**
 * 智能重试机制
 * 对于可能失败的操作进行智能重试
 *
 * @param operation - 要执行的操作
 * @param options - 配置选项
 */
export async function smartRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number
    delay?: number
    shouldRetry?: (error: any) => boolean
  } = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, shouldRetry } = options
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // 检查是否应该重试
      if (shouldRetry && !shouldRetry(error)) {
        throw error
      }

      if (i < maxRetries - 1) {
        console.log(`[智能重试] 第 ${i + 1} 次失败，${delay}ms 后重试`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError
}

/**
 * 监控游戏进度
 * 长时间运行的测试中监控游戏是否有进展
 */
export class GameProgressMonitor {
  private lastCardCount: number = 27
  private noProgressCount: number = 0
  private maxNoProgress: number = 10

  constructor(maxNoProgress: number = 10) {
    this.maxNoProgress = maxNoProgress
  }

  /**
   * 检查是否有进展
   */
  async checkProgress(page: Page): Promise<{
    hasProgress: boolean
    currentCardCount: number
    isStuck: boolean
  }> {
    const currentCardCount = await page.locator('[data-card-id]').count()
    const hasProgress = currentCardCount !== this.lastCardCount

    if (hasProgress) {
      this.lastCardCount = currentCardCount
      this.noProgressCount = 0
    } else {
      this.noProgressCount++
    }

    return {
      hasProgress,
      currentCardCount,
      isStuck: this.noProgressCount >= this.maxNoProgress,
    }
  }

  /**
   * 重置监控器
   */
  reset(cardCount: number = 27): void {
    this.lastCardCount = cardCount
    this.noProgressCount = 0
  }

  /**
   * 获取无进展次数
   */
  getNoProgressCount(): number {
    return this.noProgressCount
  }
}
