'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import { ensureAuthed } from '@/lib/utils/ensureAuthed'
import { useToast } from '@/lib/hooks/useToast'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { Mail, ArrowRight, Sparkles } from 'lucide-react'

/**
 * 登录页面
 *
 * 使用匿名认证，用户点击"开始游戏"即可快速进入。
 * 遵循 Impeccable Frontend Design 原则
 */
export default function LoginPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { showToast } = useToast()
  const { theme } = useTheme()

  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [isClient, setIsClient] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    // 如果用户已登录，重定向到大厅
    if (isClient && user) {
      router.push('/lobby')
    }
  }, [user, isClient, router])

  const handleQuickStart = async () => {
    setIsLoading(true)
    try {
      const { ok } = await ensureAuthed({
        onError: (msg) => showToast({ message: msg, kind: 'error' })
      })
      if (ok) {
        router.push('/lobby')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      showToast({ message: '请输入邮箱地址', kind: 'error' })
      return
    }
    // TODO: 实现邮箱登录
    setShowEmailForm(false)
    handleQuickStart()
  }

  if (!isClient) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <main style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.8)', animation: 'pulse 1.5s ease-in-out infinite' }}>加载中...</div>
        </main>
      </SimpleEnvironmentBackground>
    )
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <main style={{
        display: 'flex',
        minHeight: '100vh',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        position: 'relative',
        zIndex: 10,
      }}>
        <div style={{ width: '100%', maxWidth: '28rem', animation: 'fadeInUp 0.4s ease-out' }}>
          {/* Logo 和标题 */}
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <div style={{ marginBottom: '1.5rem', animation: 'scaleIn 0.5s ease-out' }}>
              {/* Logo */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, #d4af37 0%, #b8962e 100%)',
                borderRadius: '16px',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
                marginBottom: '1rem',
              }}>
                <span style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white' }}>掼</span>
              </div>
            </div>

            <h1 style={{
              fontSize: '2rem',
              fontWeight: 700,
              color: 'white',
              marginBottom: '0.75rem',
              lineHeight: 1.2,
            }}>
              掼蛋<span style={{ color: '#d4af37' }}>叁</span>
            </h1>
            <p style={{ fontSize: '1.125rem', color: 'rgba(255, 255, 255, 0.7)' }}>
              智者博弈 · 经典传承
            </p>
          </div>

          {/* 登录卡片 */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '2rem',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            animation: 'fadeInUp 0.4s ease-out 0.1s both',
          }}>
            {!showEmailForm ? (
              <QuickStartForm
                isLoading={isLoading}
                onQuickStart={handleQuickStart}
                onShowEmailForm={() => setShowEmailForm(true)}
              />
            ) : (
              <EmailForm
                email={email}
                isLoading={isLoading}
                onEmailChange={setEmail}
                onSubmit={handleEmailLogin}
                onBack={() => setShowEmailForm(false)}
              />
            )}
          </div>

          {/* 底部链接 */}
          <div style={{
            marginTop: '2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            animation: 'fadeIn 0.3s ease-out 0.3s both',
          }}>
            <button
              onClick={() => router.push('/rules')}
              style={{
                color: 'rgba(255, 255, 255, 0.6)',
                cursor: 'pointer',
                background: 'none',
                border: 'none',
                fontSize: '0.875rem',
                padding: '0.25rem 0',
                transition: 'all 0.2s',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#d4af37'
                e.currentTarget.style.textDecoration = 'underline'
                e.currentTarget.style.textUnderlineOffset = '4px'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)'
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              游戏规则
            </button>
            <p style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: '0.75rem', margin: 0 }}>
              登录即表示您同意我们的服务条款和隐私政策
            </p>
          </div>
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes arrowSlide {
          from { transform: translateX(0); }
          to { transform: translateX(4px); }
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}

/**
 * 内联样式按钮组件
 */
function InlineButton({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  isLoading = false,
  onClick,
  style,
  type = 'button',
}: {
  children: React.ReactNode
  variant?: 'primary' | 'outline'
  size?: 'md' | 'lg'
  disabled?: boolean
  isLoading?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  type?: 'button' | 'submit'
}) {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: size === 'lg' ? '0.75rem 1.5rem' : '0.625rem 1.25rem',
    borderRadius: '12px',
    fontSize: size === 'lg' ? '1rem' : '0.875rem',
    fontWeight: 500,
    border: '2px solid',
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.5 : 1,
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    minHeight: '44px',
    ...style,
  }

  const variantStyles = {
    primary: {
      backgroundColor: isHovered && !disabled && !isLoading ? '#2d5a3d' : '#1a472a',
      borderColor: '#1a472a',
      color: 'white',
    } as React.CSSProperties,
    outline: {
      backgroundColor: isHovered && !disabled && !isLoading ? 'rgba(0, 0, 0, 0.05)' : 'transparent',
      borderColor: '#e5e7eb',
      color: '#111827',
    } as React.CSSProperties,
  }

  const grayButtonStyle: React.CSSProperties = {
    ...baseStyles,
    ...variantStyles[variant],
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      style={grayButtonStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  )
}

/**
 * 快速开始表单
 */
function QuickStartForm({
  isLoading,
  onQuickStart,
  onShowEmailForm
}: {
  isLoading: boolean
  onQuickStart: () => void
  onShowEmailForm: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideInRight 0.2s ease-out' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '64px',
          height: '64px',
          background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)',
          borderRadius: '16px',
          marginBottom: '1rem',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        }}>
          <Sparkles style={{ width: '32px', height: '32px', color: 'white' }} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
          欢迎来到掼蛋
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem', lineHeight: 1.6 }}>
          匿名登录，无需注册，即刻开始游戏
        </p>
      </div>

      <InlineButton
        onClick={onQuickStart}
        isLoading={isLoading}
        size="lg"
        style={{ width: '100%' }}
      >
        {isLoading ? (
          '登录中...'
        ) : (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            快速开始
            <ArrowRight style={{ width: '20px', height: '20px', transition: 'transform 0.2s' }} />
          </span>
        )}
      </InlineButton>

      <div style={{ position: 'relative', margin: '0.5rem 0' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{ width: '100%', borderTop: '2px solid #e5e7eb' }} />
        </div>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <span style={{
            padding: '0 1rem',
            backgroundColor: 'white',
            color: '#6b7280',
            fontSize: '0.875rem',
          }}>或</span>
        </div>
      </div>

      <button
        onClick={onShowEmailForm}
        disabled={isLoading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem',
          padding: '0.75rem 1rem',
          backgroundColor: '#f3f4f6',
          color: '#111827',
          borderRadius: '12px',
          fontSize: '0.875rem',
          fontWeight: 500,
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          opacity: isLoading ? 0.5 : 1,
          transition: 'all 0.2s',
          minHeight: '44px',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#e5e7eb'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#f3f4f6'
        }}
      >
        <Mail style={{ width: '20px', height: '20px' }} />
        使用邮箱登录
      </button>
    </div>
  )
}

/**
 * 邮箱登录表单
 */
function EmailForm({
  email,
  isLoading,
  onEmailChange,
  onSubmit,
  onBack
}: {
  email: string
  isLoading: boolean
  onEmailChange: (email: string) => void
  onSubmit: (e: React.FormEvent) => void
  onBack: () => void
}) {
  return (
    <form
      onSubmit={onSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideInLeft 0.2s ease-out' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>
          邮箱登录
        </h2>
        <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
          输入您的邮箱地址继续
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: 500,
              color: '#374151',
              marginBottom: '0.5rem',
            }}
          >
            邮箱地址
          </label>
          <div style={{ position: 'relative' }}>
            <Mail style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '20px',
              height: '20px',
              color: '#9ca3af',
              pointerEvents: 'none',
            }} />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
              disabled={isLoading}
              required
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                backgroundColor: 'white',
                border: '2px solid #d1d5db',
                borderRadius: '12px',
                fontSize: '0.9375rem',
                color: '#111827',
                outline: 'none',
                transition: 'all 0.2s',
                opacity: isLoading ? 0.5 : 1,
                cursor: isLoading ? 'not-allowed' : 'text',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(245, 158, 11, 0.1)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#d1d5db'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <InlineButton
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          style={{ flex: 1 }}
        >
          返回
        </InlineButton>
        <InlineButton
          type="submit"
          isLoading={isLoading}
          style={{ flex: 1 }}
        >
          继续
        </InlineButton>
      </div>
    </form>
  )
}
