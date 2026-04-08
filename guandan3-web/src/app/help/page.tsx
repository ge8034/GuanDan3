'use client'

import Link from 'next/link'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { useRouter } from 'next/navigation'
import { Book, HelpCircle, MessageCircle, Settings, Users, Zap, ArrowLeft, Search } from 'lucide-react'

// 内联样式卡片组件
function InlineCard({
  title,
  description,
  icon: Icon,
  style,
  href,
  onClick,
  children
}: {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  style?: React.CSSProperties
  href?: string
  onClick?: () => void
  children?: React.ReactNode
}) {
  const content = (
    <>
      {Icon && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Icon style={{ width: '24px', height: '24px', color: '#1a472a' }} />
          <span style={{ fontSize: '1.125rem', fontWeight: 600, color: '#111827' }}>{title}</span>
        </div>
      )}
      {description && <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{description}</p>}
      {children}
    </>
  )

  const cardStyle: React.CSSProperties = {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(8px)',
    borderRadius: '16px',
    border: '2px solid #e5e7eb',
    padding: '1.5rem',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    transition: 'box-shadow 0.2s',
    cursor: href || onClick ? 'pointer' : 'default',
    ...style,
  }

  if (href) {
    return (
      <Link href={href} style={cardStyle} onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }} onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}>
        {content}
      </Link>
    )
  }

  return (
    <div style={cardStyle} onClick={onClick} onMouseEnter={(e) => {
      if (onClick) e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
    }} onMouseLeave={(e) => {
      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>
      {content}
    </div>
  )
}

// 内联样式按钮组件
function InlineButton({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  style,
  href
}: {
  children: React.ReactNode
  variant?: 'primary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onClick?: () => void
  style?: React.CSSProperties
  href?: string
}) {
  const baseStyle: React.CSSProperties = {
    padding: size === 'sm' ? '0.5rem 1rem' : size === 'lg' ? '0.75rem 1.5rem' : '0.625rem 1.25rem',
    borderRadius: '8px',
    fontSize: size === 'lg' ? '1rem' : '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: '2px solid',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    textDecoration: 'none',
    ...style,
  }

  const variantStyles = {
    primary: {
      backgroundColor: '#1a472a',
      borderColor: '#1a472a',
      color: 'white',
    },
    outline: {
      backgroundColor: 'transparent',
      borderColor: '#e5e7eb',
      color: '#111827',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: '#6b7280',
    },
  }

  const buttonStyle = { ...baseStyle, ...variantStyles[variant] }

  if (href) {
    return (
      <Link
        href={href}
        style={buttonStyle}
        onMouseEnter={(e) => {
          if (variant === 'primary') {
            e.currentTarget.style.backgroundColor = '#2d5a3d'
          } else if (variant === 'outline') {
            e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor as string
        }}
      >
        {children}
      </Link>
    )
  }

  return (
    <button
      onClick={onClick}
      style={buttonStyle}
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.backgroundColor = '#2d5a3d'
        } else if (variant === 'outline') {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor as string
      }}
    >
      {children}
    </button>
  )
}

export default function HelpPage() {
  const router = useRouter()
  const { theme } = useTheme()

  const helpCategories = [
    {
      title: '快速入门',
      description: '了解如何开始游戏',
      icon: Zap,
      items: [
        { title: '开始游戏', href: '#start' },
        { title: '基本操作', href: '#operations' },
        { title: '房间说明', href: '#room-info' }
      ]
    },
    {
      title: '游戏规则',
      description: '学习掼蛋的游戏规则',
      icon: Book,
      items: [
        { title: '牌型说明', href: '#card-types' },
        { title: '游戏流程', href: '#game-flow' },
        { title: '升级规则', href: '#level-up' }
      ]
    },
    {
      title: '房间系统',
      description: '了解房间创建和管理',
      icon: Users,
      items: [
        { title: '创建房间', href: '#create-room' },
        { title: '加入房间', href: '#join-room' },
        { title: '房间设置', href: '#room-settings' }
      ]
    },
    {
      title: '好友系统',
      description: '管理好友和社交功能',
      icon: MessageCircle,
      items: [
        { title: '添加好友', href: '#add-friend' },
        { title: '邀请好友', href: '#invite-friend' },
        { title: '好友聊天', href: '#friend-chat' }
      ]
    },
    {
      title: '设置选项',
      description: '自定义游戏体验',
      icon: Settings,
      items: [
        { title: '游戏设置', href: '#game-settings' },
        { title: '显示设置', href: '#display-settings' },
        { title: '账号设置', href: '#account-settings' }
      ]
    },
    {
      title: '常见问题',
      description: '查找常见问题的解答',
      icon: HelpCircle,
      items: [
        { title: '账号问题', href: '#account-faq' },
        { title: '游戏问题', href: '#game-faq' },
        { title: '技术问题', href: '#tech-faq' }
      ]
    }
  ]

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ minHeight: '100vh', paddingTop: '64px' }}>
        {/* 头部 */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'rgba(245, 245, 220, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
              帮助中心
            </h1>
            <button
              onClick={() => router.push('/lobby')}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '8px',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                color: '#374151',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              返回大厅
            </button>
          </div>
        </header>

        {/* 主内容 */}
        <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.25rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>
              帮助中心
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
              欢迎来到掼蛋3帮助中心，这里可以找到您需要的所有帮助信息
            </p>
          </div>

          {/* 搜索框 */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="搜索帮助内容..."
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem 0.75rem 3rem',
                  borderRadius: '8px',
                  border: '2px solid #e5e7eb',
                  fontSize: '0.9375rem',
                  backgroundColor: 'white',
                  color: '#111827',
                }}
              />
              <Search style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', width: '20px', height: '20px' }} />
            </div>
          </div>

          {/* 帮助分类 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            {helpCategories.map((category) => {
              const Icon = category.icon
              return (
                <InlineCard
                  key={category.title}
                  title={category.title}
                  description={category.description}
                  icon={Icon}
                >
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {category.items.map((item) => (
                      <li key={item.title}>
                        <Link
                          href={item.href}
                          style={{
                            fontSize: '0.875rem',
                            color: '#1a472a',
                            textDecoration: 'none',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.textDecoration = 'underline'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.textDecoration = 'none'
                          }}
                        >
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </InlineCard>
              )
            })}
          </div>

          {/* 快速链接 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
            <InlineCard title="用户指南" description="完整的游戏使用指南">
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                查看详细的用户指南，了解游戏的所有功能和操作方法。
              </p>
              <InlineButton variant="primary" href="/docs/user-guide">查看用户指南</InlineButton>
            </InlineCard>

            <InlineCard title="常见问题" description="快速找到问题答案">
              <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                浏览常见问题解答，快速解决您遇到的问题。
              </p>
              <InlineButton variant="outline" href="/docs/faq">查看常见问题</InlineButton>
            </InlineCard>
          </div>

          {/* 联系支持 */}
          <InlineCard
            title="需要更多帮助？"
            description="我们的客服团队随时为您服务"
            style={{ backgroundColor: 'rgba(26, 71, 42, 0.05)' }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111827' }}>邮箱</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>support@guandan3.com</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111827' }}>客服热线</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>400-XXX-XXXX</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem', color: '#111827' }}>工作时间</div>
                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>9:00-22:00</div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <InlineButton variant="primary" size="lg">联系在线客服</InlineButton>
            </div>
          </InlineCard>
        </main>
      </div>
    </SimpleEnvironmentBackground>
  )
}
