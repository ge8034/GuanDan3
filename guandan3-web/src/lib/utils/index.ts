import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
} from './error-messages';

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
} from './security';

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
} from './error-tracking';

// 错误边界组件
export {
  GameErrorBoundary,
  GameErrorFallback,
  LoadingFallback,
} from '../../components/ErrorBoundary';
