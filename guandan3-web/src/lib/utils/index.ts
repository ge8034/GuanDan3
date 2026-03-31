import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并 Tailwind CSS 类名
 *
 * 结合 clsx 和 tailwind-merge 的功能，智能处理 Tailwind 类名冲突。
 * 后面的类名会覆盖前面冲突的类名，保留不冲突的类名。
 *
 * @param inputs - 类名数组，支持字符串、对象、数组等多种格式
 * @returns 合并后的类名字符串
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', 'px-4') // 返回 'py-1 px-4' (后面的 px-4 覆盖前面的 px-2)
 * cn('btn', { 'btn-primary': isPrimary }) // 根据条件添加类
 * cn(['class1', 'class2'], null, 'class3') // 自动过滤 null/undefined
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// logger
export { logger } from './logger'

// devLog 工具
export { isDev, shouldLog, devLog, devLogCat, devWarn, devError } from './devLog'

// 错误处理相关
export {
  getSafeErrorMessage,
  getErrorDetails,
  isNetworkError,
  isAuthError,
  isRetryableError,
} from './error-messages'

// 安全相关
export {
  isValidRoomId,
  isValidNickname,
  isValidSeat,
  sanitizeHTML,
  stripAllHTML,
  isSafeURL,
  sanitizeLog,
  sanitizeGameMessage,
  isValidCard,
  isValidCardArray,
  generateSecureRandomString,
  checkRequiredEnvVars,
  getCSRFHeaders,
  isCSRFViolationFalsePositive,
  safeJSONParse,
  isGameStateVersionCompatible,
} from './security'

// 错误追踪相关
export {
  errorTracker,
  logDebug,
  logInfo,
  logWarn,
  logError,
  logFatal,
  logGameAction,
  logAPICall,
  logPerformanceMetric,
  setupGlobalErrorHandlers,
  useErrorTracking,
  setupBeforeUnloadHandler,
  recordPageLoadTiming,
  initErrorTracking,
  type ErrorLevel,
  type ErrorContext,
  type ErrorLog,
  type ErrorTrackerConfig,
} from './error-tracking'

// 错误边界组件
export {
  GameErrorBoundary,
  GameErrorFallback,
  LoadingFallback,
} from '../../components/ErrorBoundary'
