/**
 * 统一日志工具
 *
 * 提供环境感知的日志功能：
 * - 开发环境：输出到控制台
 * - 生产环境：可集成监控服务
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug(message: string, meta?: unknown): void;
  info(message: string, meta?: unknown): void;
  warn(message: string, meta?: unknown): void;
  error(message: string, error?: unknown): void;
}

/**
 * 生产环境日志实现
 *
 * TODO: 集成监控服务（如 Sentry、DataDog）
 */
class ProductionLogger implements Logger {
  debug() {
    // 生产环境禁用调试日志
  }

  info(message: string, meta?: unknown) {
    // TODO: 发送到监控服务
    // 示例：monitoringService.info(message, meta);
  }

  warn(message: string, meta?: unknown) {
    // TODO: 发送到告警服务
    // 示例：alertingService.warn(message, meta);
  }

  error(message: string, error?: unknown) {
    // TODO: 发送到错误追踪服务
    // 示例：errorTrackingService.captureError(message, error);
  }
}

/**
 * 开发环境日志实现
 *
 * 使用控制台输出，包含日志级别标识
 */
class DevelopmentLogger implements Logger {
  debug(message: string, meta?: unknown) {
    if (process.env.NEXT_PUBLIC_DEBUG === 'true') {
      console.log(`[DEBUG] ${message}`, meta ?? '');
    }
  }

  info(message: string, meta?: unknown) {
    console.info(`[INFO] ${message}`, meta ?? '');
  }

  warn(message: string, meta?: unknown) {
    console.warn(`[WARN] ${message}`, meta ?? '');
  }

  error(message: string, error?: unknown) {
    console.error(`[ERROR] ${message}`, error ?? '');
  }
}

/**
 * 导出统一的日志实例
 *
 * 使用方式：
 * ```typescript
 * import { logger } from '@/lib/utils/logger';
 *
 * logger.debug('调试信息', { data });
 * logger.info('普通信息');
 * logger.warn('警告信息');
 * logger.error('错误信息', error);
 * ```
 */
export const logger: Logger =
  process.env.NODE_ENV === 'production'
    ? new ProductionLogger()
    : new DevelopmentLogger();

/**
 * 导出类型供外部使用
 */
export type { LogLevel, Logger };
