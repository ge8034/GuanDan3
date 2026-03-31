import { logger } from './logger'

export const isDev = () => process.env.NODE_ENV === 'development'

// 日志分类
export enum LogCategory {
  GAME = 'game',           // 游戏逻辑
  AGENT = 'agent',         // AI Agent
  NETWORK = 'network',     // 网络请求
  PERFORMANCE = 'perf',     // 性能监控
  DEBUG = 'debug',         // 调试信息
  UI = 'ui',              // UI 交互
}

// 从环境变量读取启用的日志分类（默认所有）
const ENABLED_LOGS = process.env.NEXT_PUBLIC_ENABLED_LOGS?.split(',') || [LogCategory.GAME, LogCategory.AGENT, LogCategory.NETWORK, LogCategory.PERFORMANCE]

// 启用特定日志分类
const ENABLE_DEBUG_LOGS = process.env.NEXT_PUBLIC_DEBUG_LOGS === 'true'

export const shouldLog = (category?: LogCategory): boolean => {
  if (!isDev()) return false
  if (!category) return true
  if (category === LogCategory.DEBUG) return ENABLE_DEBUG_LOGS
  return ENABLED_LOGS.includes(category)
}

export const devLog = (...args: unknown[]) => {
  if (shouldLog()) {
    const message = String(args[0] ?? '')
    const meta = args.length > 1 ? args.slice(1) : undefined
    logger.debug(message, meta)
  }
}

export const devLogCat = (category: LogCategory, ...args: unknown[]) => {
  if (shouldLog(category)) {
    const message = `[${category.toUpperCase()}] ${String(args[0] ?? '')}`
    const meta = args.length > 1 ? args.slice(1) : undefined
    logger.debug(message, meta)
  }
}

export const devWarn = (...args: unknown[]) => {
  if (shouldLog()) {
    const message = String(args[0] ?? '')
    const meta = args.length > 1 ? args.slice(1) : undefined
    logger.warn(message, meta)
  }
}

export const devError = (...args: unknown[]) => {
  if (shouldLog()) {
    const message = String(args[0] ?? '')
    const meta = args.length > 1 ? args.slice(1) : undefined
    logger.error(message, meta)
  }
}
