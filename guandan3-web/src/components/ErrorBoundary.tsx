'use client';

import React from 'react';

import { logger } from '@/lib/utils/logger'
/**
 * 错误边界属性接口
 */
interface Props {
  children: React.ReactNode;
  /** 自定义错误回退组件 */
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** 错误回调函数 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * 错误边界状态接口
 */
interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 游戏错误边界组件
 *
 * 捕获子组件树中的 JavaScript 错误，显示友好的错误界面
 * 防止整个应用崩溃，提升用户体验
 *
 * @example
 * ```tsx
 * <GameErrorBoundary>
 *   <GameCanvas />
 * </GameErrorBoundary>
 * ```
 */
export class GameErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * 捕获错误时更新状态
   */
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * 记录错误信息
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // 调用自定义错误回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // TODO: 发送到错误追踪服务（如 Sentry）
    logger.error('Error caught by boundary:', { error, errorInfo });

    // 记录组件堆栈
    logger.error('Component stack:', errorInfo.componentStack);
  }

  /**
   * 重试操作
   */
  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return (
        <FallbackComponent
          error={this.state.error!}
          retry={this.handleRetry}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * 默认错误回退组件
 */
function DefaultErrorFallback({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="text-center max-w-md">
        {/* 错误图标 */}
        <div className="mb-4">
          <svg
            className="w-16 h-16 mx-auto text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>

        {/* 错误标题 */}
        <h2 className="text-2xl font-bold text-gray-900 mb-2">出错了</h2>

        {/* 错误描述 */}
        <p className="text-gray-600 mb-6">
          页面加载失败，这可能是临时问题。您可以尝试刷新页面或重新开始。
        </p>

        {/* 错误详情（开发环境） */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={retry}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            重试
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            刷新页面
          </button>
        </div>

        {/* 返回首页链接 */}
        <a
          href="/"
          className="inline-block mt-4 text-blue-600 hover:text-blue-700 underline"
        >
          返回首页
        </a>
      </div>
    </div>
  );
}

/**
 * 游戏专用错误回退组件
 */
export function GameErrorFallback({
  error,
  retry,
}: {
  error: Error;
  retry: () => void;
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-blue-900 to-blue-800 px-4">
      <div className="text-center max-w-md">
        {/* 游戏错误图标 */}
        <div className="mb-4">
          <svg
            className="w-20 h-20 mx-auto text-yellow-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* 错误标题 */}
        <h2 className="text-3xl font-bold text-white mb-2">游戏出错了</h2>

        {/* 错误描述 */}
        <p className="text-blue-100 mb-6">
          游戏进程遇到了问题，但我们已记录了此错误。您可以重试或返回大厅。
        </p>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={retry}
            className="px-6 py-3 bg-yellow-500 text-gray-900 rounded-lg hover:bg-yellow-400 transition-colors font-bold"
          >
            重新开始
          </button>
          <a
            href="/lobby"
            className="px-6 py-3 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors font-bold text-center"
          >
            返回大厅
          </a>
        </div>
      </div>
    </div>
  );
}

/**
 * 加载状态组件
 */
export function LoadingFallback(): React.JSX.Element {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {/* 加载动画 */}
        <div className="mb-4">
          <svg
            className="animate-spin w-12 h-12 mx-auto text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* 加载文字 */}
        <p className="text-gray-600 font-medium">加载中...</p>
      </div>
    </div>
  );
}
