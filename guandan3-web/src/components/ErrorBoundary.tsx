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
 * 内联样式按钮组件
 */
function InlineButton({
  children,
  variant = 'primary',
  onClick,
  href,
  disabled = false,
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary'
  onClick?: () => void
  href?: string
  disabled?: boolean
}) {
  const baseStyle: React.CSSProperties = {
    padding: '0.625rem 1.5rem',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    fontWeight: 500,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition: 'all 0.2s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    textDecoration: 'none',
    minHeight: '44px',
  }

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      backgroundColor: '#1a472a',
      color: 'white',
    },
    secondary: {
      backgroundColor: '#e5e7eb',
      color: '#111827',
    },
  }

  const buttonStyle = { ...baseStyle, ...variantStyles[variant] }

  const content = (
    <>
      {children}
    </>
  )

  if (href) {
    return (
      <a
        href={href}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (!disabled) {
            if (variant === 'primary') {
              e.currentTarget.style.backgroundColor = '#2d5a3d'
            } else {
              e.currentTarget.style.backgroundColor = '#d1d5db'
            }
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor as string
        }}
      >
        {content}
      </a>
    )
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (!disabled) {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = '#2d5a3d'
          } else {
            e.currentTarget.style.backgroundColor = '#d1d5db'
          }
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor as string
      }}
    >
      {content}
    </button>
  )
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '1rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        {/* 错误图标 */}
        <div style={{ marginBottom: '1rem' }}>
          <svg
            style={{ width: '64px', height: '64px', margin: '0 auto', color: '#ef4444' }}
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
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 700,
          color: '#111827',
          marginBottom: '0.5rem',
        }}>
          出错了
        </h2>

        {/* 错误描述 */}
        <p style={{
          color: '#6b7280',
          marginBottom: '1.5rem',
          lineHeight: 1.6,
        }}>
          页面加载失败，这可能是临时问题。您可以尝试刷新页面或重新开始。
        </p>

        {/* 错误详情（开发环境） */}
        {process.env.NODE_ENV === 'development' && error.message && (
          <div style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
          }}>
            <p style={{
              color: '#ef4444',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
            }}>
              {error.message}
            </p>
          </div>
        )}

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <InlineButton variant="primary" onClick={retry}>
            重试
          </InlineButton>
          <InlineButton
            variant="secondary"
            onClick={() => window.location.reload()}
          >
            刷新页面
          </InlineButton>
        </div>

        {/* 返回首页链接 */}
        <InlineButton
          variant="secondary"
          href="/"
          style={{ marginTop: '1rem', display: 'inline-block' }}
        >
          返回首页
        </InlineButton>
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%)',
      padding: '1rem',
    }}>
      <div style={{ textAlign: 'center', maxWidth: '28rem' }}>
        {/* 游戏错误图标 */}
        <div style={{ marginBottom: '1rem' }}>
          <svg
            style={{ width: '80px', height: '80px', margin: '0 auto', color: '#f59e0b' }}
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
        <h2 style={{
          fontSize: '1.875rem',
          fontWeight: 700,
          color: 'white',
          marginBottom: '0.5rem',
        }}>
          游戏出错了
        </h2>

        {/* 错误描述 */}
        <p style={{
          color: 'rgba(219, 234, 254, 0.8)',
          marginBottom: '1.5rem',
          lineHeight: 1.6,
        }}>
          游戏进程遇到了问题，但我们已记录了此错误。您可以重试或返回大厅。
        </p>

        {/* 操作按钮 */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
          justifyContent: 'center',
        }}>
          <InlineButton
            variant="primary"
            onClick={retry}
            style={{
              backgroundColor: '#f59e0b',
              color: '#111827',
            }}
          >
            重新开始
          </InlineButton>
          <InlineButton
            variant="secondary"
            href="/lobby"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
            }}
          >
            返回大厅
          </InlineButton>
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
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
    }}>
      <div style={{ textAlign: 'center' }}>
        {/* 加载动画 */}
        <div style={{ marginBottom: '1rem' }}>
          <svg
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto',
              color: '#1a472a',
              animation: 'spin 1s linear infinite',
            }}
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              style={{ opacity: 0.25 }}
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              style={{ opacity: 0.75 }}
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>

        {/* 加载文字 */}
        <p style={{ color: '#6b7280', fontWeight: 500 }}>加载中...</p>
      </div>
    </div>
  );
}
