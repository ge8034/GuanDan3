'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Avatar } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { useAuthStore } from '@/lib/store/auth'
import { mapSupabaseErrorToMessage } from '@/lib/utils/supabaseErrors'
import { ScrollText, Inbox, ArrowLeft, AlertTriangle } from 'lucide-react'

// 内联样式按钮组件
function InlineButton({
  children,
  variant = 'outline',
  onClick,
  style,
  theme,
}: {
  children: React.ReactNode
  variant?: 'outline' | 'ghost'
  onClick?: () => void
  style?: React.CSSProperties
  theme: string
}) {
  const baseStyle = {
    width: '100%',
    padding: '0.625rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    border: '2px solid',
  }

  const variantStyles = {
    outline: {
      backgroundColor: 'transparent',
      borderColor: theme === 'poker' ? '#2d5a3d' : '#d1d5db',
      color: theme === 'poker' ? '#1a472a' : '#374151',
    },
    ghost: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: '#ef4444',
    },
  }

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyle, ...variantStyles[variant], ...style }}
      onMouseEnter={(e) => {
        if (variant === 'outline') {
          e.currentTarget.style.backgroundColor = theme === 'poker' ? 'rgba(45, 90, 61, 0.1)' : 'rgba(0, 0, 0, 0.05)'
        } else {
          e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {children}
    </button>
  )
}

type GameStats = {
  totalGames: number
  totalWins: number
  totalLosses: number
  winRate: number
  totalScore: number
  bestScore: number
}

type GameRecord = {
  id: string
  created_at: string
  delta: number
  total_after: number
  game: {
    room: {
      name: string
      mode: string
    }
  }
}

// 统计卡片组件
function StatCard({
  label,
  value,
  color = '#1a472a',
  delay = 0
}: {
  label: string
  value: number | string
  color?: string
  delay?: number
}) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '2px solid rgba(0, 0, 0, 0.1)',
        padding: '1rem',
        textAlign: 'center',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        animation: `fadeIn 0.3s ease-out ${delay}ms both`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ fontSize: '1.5rem', fontWeight: 700, color, marginBottom: '0.25rem' }}>
        {value}
      </div>
      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{label}</div>
    </div>
  )
}

export default function ProfilePage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useAuthStore()
  const [stats, setStats] = useState<GameStats | null>(null)
  const [recentRecords, setRecentRecords] = useState<GameRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const authUser = useAuthStore.getState().user
        if (!authUser) {
          router.replace('/')
          return
        }

        const { data: records, error: recordsError } = await supabase
          .from('scores')
          .select(`
            id,
            created_at,
            delta,
            total_after,
            game:games (
              room:rooms (
                name,
                mode
              )
            )
          `)
          .eq('uid', authUser.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (recordsError) throw recordsError

        const gameRecords = records as any
        setRecentRecords(gameRecords)

        const totalGames = gameRecords.length
        const totalWins = gameRecords.filter((r: GameRecord) => r.delta > 0).length
        const totalLosses = gameRecords.filter((r: GameRecord) => r.delta < 0).length
        const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0
        const totalScore = gameRecords.length > 0 ? gameRecords[0].total_after : 0
        const bestScore = gameRecords.length > 0 ? Math.max(...gameRecords.map((r: GameRecord) => r.total_after)) : 0

        setStats({
          totalGames,
          totalWins,
          totalLosses,
          winRate,
          totalScore,
          bestScore,
        })
      } catch (e: any) {
        console.error(e)
        setError(mapSupabaseErrorToMessage(e, '获取用户信息失败'))
      } finally {
        setLoading(false)
      }
    }

    fetchProfileData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <div style={{ minHeight: '100vh', padding: '1rem', paddingTop: '64px' }}>
          <div style={{ maxWidth: '72rem', margin: '0 auto' }}>
            <div style={{
              height: '80px',
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '16px',
              marginBottom: '1.5rem',
              animation: 'pulse 1.5s ease-in-out infinite'
            }} />
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '1.5rem',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(0, 0, 0, 0.1)' }} />
                <div style={{ width: '200px', height: '24px', borderRadius: '4px', backgroundColor: 'rgba(0, 0, 0, 0.1)' }} />
              </div>
            </div>
          </div>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  if (error) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              border: '2px solid #e5e7eb',
              padding: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              maxWidth: '32rem',
              width: '100%',
              textAlign: 'center'
            }}
          >
            <AlertTriangle style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#f59e0b' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>加载失败</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={() => router.push('/lobby')}
              style={{
                width: '100%',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: '2px solid #1a472a',
                backgroundColor: '#1a472a',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2d5a3d'
                e.currentTarget.style.borderColor = '#2d5a3d'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1a472a'
                e.currentTarget.style.borderColor = '#1a472a'
              }}
            >
              返回大厅
            </button>
          </div>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ minHeight: '100vh', paddingTop: '80px' }}>
        {/* 头部 */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'rgba(245, 245, 220, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div style={{ maxWidth: '72rem', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>
              个人中心
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

        <main style={{ maxWidth: '72rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {/* 用户信息卡片 */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '16px',
                border: '2px solid ' + (theme === 'poker' ? '#2d5a3d' : '#d1d5db'),
                padding: '2rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                animation: 'fadeIn 0.3s ease-out 0.1s both'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                <Avatar
                  alt={user?.email || '玩家'}
                  size="xl"
                  style={{ width: '80px', height: '80px' }}
                />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#111827' }}>
                    {user?.email?.split('@')[0] || '玩家'}
                  </h2>
                  <p style={{ color: '#6b7280', marginBottom: '1rem' }}>{user?.email || 'demo@example.com'}</p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                    <span
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '20px',
                        backgroundColor: '#1a472a',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      等级 {Math.floor((stats?.totalScore || 0) / 100) + 1}
                    </span>
                    <span
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '20px',
                        backgroundColor: '#22c55e',
                        color: 'white',
                        fontSize: '0.875rem',
                        fontWeight: 500
                      }}
                    >
                      {stats?.winRate || 0}% 胜率
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <InlineButton variant="outline" theme={theme} onClick={() => router.push('/friends')}>
                    好友管理
                  </InlineButton>
                  <InlineButton variant="outline" theme={theme} onClick={() => router.push('/history')}>
                    查看战绩
                  </InlineButton>
                  <InlineButton variant="ghost" theme={theme} onClick={handleLogout}>
                    退出登录
                  </InlineButton>
                </div>
              </div>
            </div>

            {/* 统计数据 */}
            <div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '1rem', color: '#111827' }}>
                游戏统计
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
                <StatCard label="总场次" value={stats?.totalGames || 0} delay={0} />
                <StatCard label="胜利" value={stats?.totalWins || 0} color="#22c55e" delay={50} />
                <StatCard label="失败" value={stats?.totalLosses || 0} color="#ef4444" delay={100} />
                <StatCard label="胜率" value={`${stats?.winRate || 0}%`} delay={150} />
                <StatCard label="当前积分" value={stats?.totalScore || 0} color="#f59e0b" delay={200} />
                <StatCard label="最高积分" value={stats?.bestScore || 0} delay={250} />
              </div>
            </div>

            {/* 最近战绩 */}
            {recentRecords.length > 0 && (
              <div
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '16px',
                  border: '2px solid ' + (theme === 'poker' ? '#2d5a3d' : '#d1d5db'),
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  animation: 'fadeIn 0.3s ease-out 0.3s both'
                }}
              >
                <div style={{ padding: '1.5rem', borderBottom: '2px solid rgba(0, 0, 0, 0.1)' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <ScrollText style={{ width: '24px', height: '24px' }} />
                    最近战绩
                  </h3>
                </div>

                <div>
                  {recentRecords.slice(0, 10).map((record, index) => (
                    <div
                      key={record.id}
                      style={{
                        padding: '1rem 1.5rem',
                        borderBottom: index < Math.min(recentRecords.length, 10) - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'background-color 0.15s ease-out',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem', color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          {record.game.room.name}
                          <span
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              backgroundColor: record.game.room.mode === 'pve1v3' ? '#3b82f6' : '#1a472a',
                              color: 'white',
                              fontSize: '0.75rem',
                              fontWeight: 500
                            }}
                          >
                            {record.game.room.mode === 'pve1v3' ? '练习' : '对战'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                          {new Date(record.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                        <div
                          style={{
                            fontSize: '1.25rem',
                            fontWeight: 700,
                            color: record.delta > 0 ? '#22c55e' : record.delta < 0 ? '#ef4444' : '#6b7280'
                          }}
                        >
                          {record.delta > 0 ? '+' : ''}{record.delta}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                          积分: {record.total_after}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '1rem 1.5rem', borderTop: '2px solid rgba(0, 0, 0, 0.1)' }}>
                  <InlineButton variant="outline" theme={theme} onClick={() => router.push('/history')}>
                    查看全部战绩
                  </InlineButton>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}
