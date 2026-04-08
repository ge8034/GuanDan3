'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/store/auth'
import { useToast } from '@/lib/hooks/useToast'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { ensureAuthed } from '@/lib/utils/ensureAuthed'
import { logger } from '@/lib/utils/logger'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { Users, Book, Shield, Clock, Trophy, Play } from 'lucide-react'
import { LightningIcon } from '@/components/icons/LandscapeIcons'

export default function Home() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { showToast, toastView } = useToast()
  const { theme } = useTheme()

  useEffect(() => {
    setIsClient(true)
    // 设置全局调试变量
    ;(window as any).DEBUG = {
      supabase,
      useAuthStore,
      getSession: () => supabase.auth.getSession(),
      getUser: () => useAuthStore.getState().user
    }
    logger.debug('[DEBUG] 全局变量已设置，使用 window.DEBUG 访问')
  }, [])

  const handleLobbyEnter = async () => {
    setIsLoading(true)
    try {
      const storeUser = useAuthStore.getState().user
      if (!storeUser) {
        const { ok } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
        if (!ok) return
      }
      router.push('/lobby')
    } finally {
      setIsLoading(false)
    }
  }

  const createPracticeRoom = async () => {
    setIsLoading(true)
    try {
      logger.debug('[DEBUG] 开始创建练习房间')

      // 确保认证
      let storeUser = useAuthStore.getState().user
      logger.debug('[DEBUG] storeUser:', storeUser)

      if (!storeUser) {
        logger.debug('[DEBUG] 用户未认证，调用ensureAuthed')
        const { ok, user: authedUser } = await ensureAuthed({ onError: msg => showToast({ message: msg, kind: 'error' }) })
        logger.debug('[DEBUG] ensureAuthed结果:', { ok, user: authedUser })
        if (!ok || !authedUser) return
        storeUser = authedUser
      }

      // 确保用户ID存在
      const userId = storeUser.id
      if (!userId) {
        logger.error('[DEBUG] 用户ID不存在:', storeUser)
        showToast({ message: '用户认证信息异常，请重试', kind: 'error' })
        return
      }

      logger.debug('[DEBUG] 用户ID:', userId)

      // 明确传递用户ID作为参数
      const { data, error } = await supabase.rpc('create_practice_room', {
        p_visibility: 'private',
        p_user_id: userId
      })

      if (error) {
        logger.error('Create room failed:', error)
        showToast({ message: mapSupabaseErrorToMessage(error, '创建房间失败'), kind: 'error' })
        return
      }

      const roomId = data?.[0]?.room_id
      if (roomId) {
        router.push(`/room/${roomId}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isClient) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <main className="flex min-h-screen flex-col items-center justify-center p-24 gap-8">
           {toastView}
          <h1 className="text-4xl font-bold text-white">掼蛋 3</h1>
          <div className="animate-pulse text-neutral-300">加载中...</div>
        </main>
      </SimpleEnvironmentBackground>
    )
  }

  const featureCards = [
    {
      icon: LightningIcon,
      title: '智能AI',
      description: '高智商AI对手，提供不同难度级别',
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #60a5fa, #3b82f6)'
    },
    {
      icon: Shield,
      title: '公平竞技',
      description: '完善的防作弊系统，确保公平公正',
      color: '#22c55e',
      bgGradient: 'linear-gradient(135deg, #4ade80, #22c55e)'
    },
    {
      icon: Clock,
      title: '极速匹配',
      description: '智能匹配系统，快速找到对手',
      color: '#a855f7',
      bgGradient: 'linear-gradient(135deg, #c084fc, #a855f7)'
    }
  ]

  const stats = [
    { value: '10K+', label: '活跃玩家' },
    { value: '50K+', label: '对局总数' },
    { value: '4.9', label: '用户评分' },
    { value: '99.9%', label: '在线率' }
  ]

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ minHeight: '100vh', paddingTop: '80px' }}>
        <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
          {toastView}

          {/* Hero Section */}
          <section style={{ textAlign: 'center', marginBottom: '4rem' }}>
            {/* 在线状态 */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(4px)',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                marginBottom: '2rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'white' }}>
                在线人数: 1,234
              </span>
            </div>

            {/* 标题 */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1
                style={{
                  fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                  fontWeight: 700,
                  color: 'white',
                  lineHeight: 1.1,
                  marginBottom: '0.5rem',
                  textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(212,175,55,0.3)',
                }}
              >
                掼蛋游戏
              </h1>
              <p
                style={{
                  fontSize: 'clamp(1rem, 2vw, 1.25rem)',
                  color: '#d4af37',
                  fontWeight: 600,
                  marginBottom: '0.5rem',
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                  letterSpacing: '0.05em',
                }}
              >
                智者博弈 · 经典传承 · 在线竞技
              </p>
              <p
                style={{
                  fontSize: 'clamp(0.9375rem, 2vw, 1.125rem)',
                  color: 'rgba(255, 255, 255, 0.8)',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                体验最专业的掼蛋游戏平台，与全球玩家实时对战，挑战高智商AI对手
              </p>
            </div>

            {/* CTA 按钮 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
              <button
                onClick={createPracticeRoom}
                disabled={isLoading}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '12px',
                  border: '2px solid #d4af37',
                  backgroundColor: '#d4af37',
                  color: '#1a1a1a',
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(212, 175, 55, 0.4)',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity: isLoading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(212, 175, 55, 0.6)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(212, 175, 55, 0.4)'
                }}
              >
                {isLoading ? (
                  <>
                    <span style={{ animation: 'spin 1s linear infinite' }}>⏳</span>
                    加载中...
                  </>
                ) : (
                  <>
                    <Play style={{ width: '20px', height: '20px' }} />
                    开始练习
                  </>
                )}
              </button>
              <button
                onClick={handleLobbyEnter}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '12px',
                  border: '2px solid rgba(255, 255, 255, 0.4)',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(4px)',
                  color: 'white',
                  fontSize: '1.125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                }}
              >
                <Users style={{ width: '20px', height: '20px' }} />
                进入大厅
              </button>
            </div>
          </section>

          {/* 特性卡片 */}
          <section style={{ marginBottom: '4rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {featureCards.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <div
                    key={index}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(8px)',
                      borderRadius: '16px',
                      border: '2px solid #e5e7eb',
                      padding: '2rem',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      textAlign: 'center',
                      animation: `fadeIn 0.5s ease-out ${index * 100}ms both`
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-8px)'
                      e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0, 0, 0, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                  >
                    <div
                      style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        background: feature.bgGradient,
                        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
                      }}
                    >
                      <div style={{ color: 'white' }}>
                        <Icon size="md" />
                      </div>
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', marginBottom: '0.75rem' }}>
                      {feature.title}
                    </h3>
                    <p style={{ fontSize: '0.9375rem', color: '#6b7280', lineHeight: 1.6 }}>
                      {feature.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 数据统计 */}
          <section style={{ marginBottom: '4rem' }}>
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(8px)',
                borderRadius: '20px',
                border: '2px solid rgba(255, 255, 255, 0.2)',
                padding: '3rem 2rem',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '2rem' }}>
                {stats.map((stat, index) => (
                  <div key={index} style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
                        fontWeight: 700,
                        color: 'white',
                        marginBottom: '0.5rem',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* 底部链接 */}
          <section style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
            <button
              onClick={() => router.push('/rules')}
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '10px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(4px)',
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.color = '#d4af37'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
              }}
            >
              <Book style={{ width: '20px', height: '20px' }} />
              游戏规则
            </button>

            <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.8)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => router.push('/leaderboard')}>
                <Trophy style={{ width: '16px', height: '16px', color: '#d4af37' }} />
                <span>排行榜</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }} onClick={() => router.push('/friends')}>
                <Users style={{ width: '16px', height: '16px', color: '#d4af37' }} />
                <span>好友系统</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Shield style={{ width: '16px', height: '16px', color: '#d4af37' }} />
                <span>安全可靠</span>
              </div>
            </div>
          </section>
        </main>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}
