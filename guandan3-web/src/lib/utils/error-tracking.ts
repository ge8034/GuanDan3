/**
 * 错误追踪和日志记录工具
 * 提供统一的错误记录、上报和监控功能
 */


import { logger } from '@/lib/utils/logger'
/**
 * 错误级别枚举
 */
export enum ErrorLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

/**
 * 错误上下文接口
 */
export interface ErrorContext {
  /** 错误发生的组件或页面 */
  component?: string;
  /** 用户操作 */
  action?: string;
  /** 相关的游戏 ID */
  gameId?: string;
  /** 相关的房间 ID */
  roomId?: string;
  /** 额外的上下文数据 */
  extra?: Record<string, unknown>;
  /** 用户 ID */
  userId?: string;
  /** 时间戳 */
  timestamp?: number;
}

/**
 * 错误记录接口
 */
export interface ErrorLog {
  level: ErrorLevel;
  message: string;
  error?: Error;
  context?: ErrorContext;
  stack?: string;
  userAgent?: string;
  url?: string;
}

/**
 * 错误追踪器配置
 */
export interface ErrorTrackerConfig {
  /** 是否启用错误追踪 */
  enabled?: boolean;
  /** 错误上报端点 */
  endpoint?: string;
  /** 采样率（0-1） */
  sampleRate?: number;
  /** 是否在开发环境输出详细日志 */
  verbose?: boolean;
  /** 最大队列大小 */
  maxQueueSize?: number;
  /** 上报批次大小 */
  batchSize?: number;
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<ErrorTrackerConfig> = {
  enabled: true,
  endpoint: '/api/errors',
  sampleRate: 1.0,
  verbose: process.env.NODE_ENV === 'development',
  maxQueueSize: 100,
  batchSize: 10,
};

/**
 * 错误追踪器类
 */
class ErrorTracker {
  private config: Required<ErrorTrackerConfig>;
  private errorQueue: ErrorLog[] = [];
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  constructor(config: ErrorTrackerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupOnlineListeners();
  }

  /**
   * 设置网络状态监听器
   */
  private setupOnlineListeners(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });
    }
  }

  /**
   * 记录错误
   */
  log(
    level: ErrorLevel,
    message: string,
    error?: Error,
    context?: ErrorContext,
  ): void {
    if (!this.config.enabled) {
      return;
    }

    // 采样率控制
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    const errorLog: ErrorLog = {
      level,
      message,
      error,
      context: {
        ...context,
        timestamp: Date.now(),
      },
      stack: error?.stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };

    // 开发环境输出详细日志
    if (this.config.verbose) {
      this.logToConsole(errorLog);
    }

    // 添加到队列
    this.errorQueue.push(errorLog);

    // 限制队列大小
    if (this.errorQueue.length > this.config.maxQueueSize) {
      this.errorQueue.shift();
    }

    // 达到批次大小时上报
    if (this.errorQueue.length >= this.config.batchSize && this.isOnline) {
      this.flushQueue();
    }
  }

  /**
   * 记录调试信息
   */
  debug(message: string, context?: ErrorContext): void {
    this.log(ErrorLevel.DEBUG, message, undefined, context);
  }

  /**
   * 记录一般信息
   */
  info(message: string, context?: ErrorContext): void {
    this.log(ErrorLevel.INFO, message, undefined, context);
  }

  /**
   * 记录警告
   */
  warn(message: string, context?: ErrorContext): void {
    this.log(ErrorLevel.WARN, message, undefined, context);
  }

  /**
   * 记录错误
   */
  error(message: string, error?: Error, context?: ErrorContext): void {
    this.log(ErrorLevel.ERROR, message, error, context);
  }

  /**
   * 记录致命错误
   */
  fatal(message: string, error?: Error, context?: ErrorContext): void {
    this.log(ErrorLevel.FATAL, message, error, context);
  }

  /**
   * 输出到控制台
   */
  private logToConsole(errorLog: ErrorLog): void {
    const { level, message, error, context } = errorLog;

    const logMessage = `[${level.toUpperCase()}] ${message}`;

    switch (level) {
      case ErrorLevel.DEBUG:
      case ErrorLevel.INFO:
        logger.info(logMessage, { context, error });
        break;
      case ErrorLevel.WARN:
        logger.warn(logMessage, { context, error });
        break;
      case ErrorLevel.ERROR:
      case ErrorLevel.FATAL:
        logger.error(logMessage, { context, error });
        break;
    }
  }

  /**
   * 上报错误队列
   */
  private async flushQueue(): Promise<void> {
    if (this.errorQueue.length === 0 || !this.isOnline) {
      return;
    }

    const batch = this.errorQueue.splice(0, this.config.batchSize);

    try {
      // TODO: 实际上报到服务器
      // await fetch(this.config.endpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ errors: batch }),
      // });

      if (this.config.verbose) {
        logger.info('ErrorTracker: 已上报错误批次', batch.length);
      }
    } catch (err) {
      // 上报失败，将错误放回队列
      this.errorQueue.unshift(...batch);
      logger.error('ErrorTracker: 上报失败', err);
    }
  }

  /**
   * 手动触发队列上报
   */
  flush(): void {
    this.flushQueue();
  }

  /**
   * 清空错误队列
   */
  clear(): void {
    this.errorQueue = [];
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<ErrorTrackerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 获取队列中的错误数量
   */
  getQueueSize(): number {
    return this.errorQueue.length;
  }
}

/**
 * 全局错误追踪器实例
 */
export const errorTracker = new ErrorTracker();

/**
 * 快捷方法：记录调试信息
 */
export function logDebug(message: string, context?: ErrorContext): void {
  errorTracker.debug(message, context);
}

/**
 * 快捷方法：记录一般信息
 */
export function logInfo(message: string, context?: ErrorContext): void {
  errorTracker.info(message, context);
}

/**
 * 快捷方法：记录警告
 */
export function logWarn(message: string, context?: ErrorContext): void {
  errorTracker.warn(message, context);
}

/**
 * 快捷方法：记录错误
 */
export function logError(
  message: string,
  error?: Error,
  context?: ErrorContext,
): void {
  errorTracker.error(message, error, context);
}

/**
 * 快捷方法：记录致命错误
 */
export function logFatal(
  message: string,
  error?: Error,
  context?: ErrorContext,
): void {
  errorTracker.fatal(message, error, context);
}

/**
 * 记录游戏操作
 */
export function logGameAction(
  action: string,
  gameId: string,
  details?: Record<string, unknown>,
): void {
  logInfo(`游戏操作: ${action}`, {
    action,
    gameId,
    extra: details,
  });
}

/**
 * 记录 API 调用
 */
export function logAPICall(
  method: string,
  url: string,
  success: boolean,
  duration: number,
  error?: Error,
): void {
  const level = success ? ErrorLevel.INFO : ErrorLevel.ERROR;
  errorTracker.log(
    level,
    `API ${method} ${url} (${success ? '成功' : '失败'}) - ${duration}ms`,
    error,
    {
      action: 'api_call',
      extra: { method, url, success, duration },
    },
  );
}

/**
 * 记录性能指标
 */
export function logPerformanceMetric(
  name: string,
  value: number,
  unit: string = 'ms',
): void {
  logInfo(`性能指标: ${name} = ${value}${unit}`, {
    action: 'performance_metric',
    extra: { name, value, unit },
  });
}

/**
 * 设置全局错误处理器
 */
export function setupGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') {
    return;
  }

  // 捕获未处理的错误
  window.addEventListener('error', (event) => {
    logError(
      `全局错误: ${event.message}`,
      event.error,
      {
        component: 'global',
        action: 'unhandled_error',
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      },
    );
  });

  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      `未处理的 Promise 拒绝: ${event.reason}`,
      event.reason instanceof Error ? event.reason : undefined,
      {
        component: 'global',
        action: 'unhandled_rejection',
        extra: { reason: String(event.reason) },
      },
    );
  });

  // 捕获资源加载错误
  window.addEventListener('error', (event) => {
    if (event.target !== window) {
      const target = event.target as HTMLElement;
      logError(
        `资源加载失败: ${target.tagName}`,
        undefined,
        {
          component: 'global',
          action: 'resource_load_error',
          extra: {
            tagName: target.tagName,
            src: (target as any).src || (target as any).href,
          },
        },
      );
    }
  }, true);
}

/**
 * React 错误边界钩子
 */
export function useErrorTracking(componentName: string) {
  return {
    componentDidCatch: (error: Error, errorInfo: React.ErrorInfo) => {
      logError(
        `组件错误: ${componentName}`,
        error,
        {
          component: componentName,
          action: 'component_error',
          extra: {
            componentStack: errorInfo.componentStack,
          },
        },
      );
    },
  };
}

/**
 * 页面卸载时上报剩余错误
 */
export function setupBeforeUnloadHandler(): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.addEventListener('beforeunload', () => {
    if (errorTracker.getQueueSize() > 0) {
      // 使用 sendBeacon 在页面卸载时上报
      if (navigator.sendBeacon) {
        const data = JSON.stringify({
          errors: errorTracker.getQueueSize(),
          timestamp: Date.now(),
        });
        navigator.sendBeacon('/api/errors', data);
      }
    }
  });
}

/**
 * 性能监控：记录页面加载时间
 */
export function recordPageLoadTiming(): void {
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;

      logPerformanceMetric('页面加载时间', pageLoadTime);
      logPerformanceMetric('DOM 就绪时间', domReadyTime);
    }, 0);
  });
}

/**
 * 初始化错误追踪系统
 */
export function initErrorTracking(config?: ErrorTrackerConfig): void {
  // 更新配置
  if (config) {
    errorTracker.updateConfig(config);
  }

  // 设置全局错误处理
  setupGlobalErrorHandlers();

  // 设置页面卸载处理
  setupBeforeUnloadHandler();

  // 记录页面加载性能
  recordPageLoadTiming();

  logInfo('错误追踪系统已初始化', {
    component: 'ErrorTracker',
    action: 'init',
  });
}
