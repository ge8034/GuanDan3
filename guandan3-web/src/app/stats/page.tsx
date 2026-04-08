'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store/auth'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Zap,
  Award,
  BarChart3,
  Users,
  Flame,
  ArrowLeft
} from 'lucide-react'

// 模拟数据类型
interface PlayerStats {
  total_games: number
  win_rate: number
  average_score: number
  average_duration: number
  longest_win_streak: number
  total_bombs_used: number
  total_rockets_used: number
}

interface OverallPerformance {
  rank: number
}

interface Trends {
  win_rate_trend: number[]
  score_trend: number[]
  duration_trend: number[]
}

// 统计卡片组件
function StatCard({
  title,
  value,
  icon,
  color
}: {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'purple' | 'yellow' | 'cyan' | 'red' | 'orange' | 'pink'
}) {
  const colors = {
    blue: '#3b82f6',
    green: '#22c55e',
    purple: '#a855f7',
    yellow: '#eab308',
    cyan: '#06b6d4',
    red: '#ef4444',
    orange: '#f97316',
    pink: '#ec4899',
  }

  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '2px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
      }}
    >
      <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            padding: '0.75rem',
            borderRadius: '8px',
            backgroundColor: colors[color],
            color: 'white',
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>{title}</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{value}</div>
        </div>
      </div>
    </div>
  )
}

// 内联样式按钮组件
function InlineButton({
  children,
  variant = 'outline',
  active = false,
  onClick,
  icon
}: {
  children: React.ReactNode
  variant?: 'primary' | 'outline'
  active?: boolean
  onClick: () => void
  icon?: React.ReactNode
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.5rem 1rem',
        borderRadius: '8px',
        border: '2px solid',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        transition: 'all 0.2s',
        backgroundColor: active
          ? '#1a472a'
          : variant === 'primary'
            ? isHovered
              ? '#2d5a3d'
              : '#1a472a'
            : 'transparent',
        borderColor: active
          ? '#1a472a'
          : variant === 'primary'
            ? '#1a472a'
            : '#e5e7eb',
        color: active || variant === 'primary' ? 'white' : '#374151',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {icon}
      {children}
    </button>
  )
}

// 内联样式卡片组件
function InlineCard({
  children,
  style
}: {
  children: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div
      style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '16px',
        border: '2px solid #e5e7eb',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export default function StatsPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'games' | 'cards' | 'teams' | 'analysis'>('overview')

  // 模拟数据
  const playerStats: PlayerStats = {
    total_games: 156,
    win_rate: 62.8,
    average_score: 125.5,
    average_duration: 900,
    longest_win_streak: 8,
    total_bombs_used: 45,
    total_rockets_used: 12,
  }

  const overallPerformance: OverallPerformance = {
    rank: 42,
  }

  const trends: Trends = {
    win_rate_trend: [55, 58, 60, 62, 65, 63, 61, 64, 66, 62],
    score_trend: [100, 110, 115, 120, 130, 125, 122, 128, 135, 125],
    duration_trend: [800, 850, 900, 880, 920, 910, 890, 905, 915, 900],
  }

  useEffect(() => {
    if (user) {
      // 模拟加载数据
      setTimeout(() => setLoading(false), 500)
    }
  }, [user])

  if (loading) {
    return (
      <SimpleEnvironmentBackground theme={theme}>
        <div style={{ minHeight: '100vh', paddingTop: '80px', padding: '1rem' }}>
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                border: '3px solid #1a472a',
                borderTopColor: 'transparent',
                margin: '0 auto 1rem',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ color: '#6b7280' }}>加载统计数据中...</p>
          </div>
        </div>
      </SimpleEnvironmentBackground>
    )
  }

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
              游戏统计
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
        <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
          {/* 标签按钮 */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <InlineButton
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
              icon={<TrendingUp style={{ width: '16px', height: '16px' }} />}
            >
              概览
            </InlineButton>
            <InlineButton
              active={activeTab === 'games'}
              onClick={() => setActiveTab('games')}
              icon={<BarChart3 style={{ width: '16px', height: '16px' }} />}
            >
              游戏记录
            </InlineButton>
            <InlineButton
              active={activeTab === 'cards'}
              onClick={() => setActiveTab('cards')}
              icon={<Award style={{ width: '16px', height: '16px' }} />}
            >
              牌型统计
            </InlineButton>
            <InlineButton
              active={activeTab === 'teams'}
              onClick={() => setActiveTab('teams')}
              icon={<Users style={{ width: '16px', height: '16px' }} />}
            >
              队友统计
            </InlineButton>
            <InlineButton
              active={activeTab === 'analysis'}
              onClick={() => setActiveTab('analysis')}
              icon={<Target style={{ width: '16px', height: '16px' }} />}
            >
              性能分析
            </InlineButton>
          </div>

          {/* 概览标签 */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* 第一行统计卡片 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard title="总场次" value={playerStats.total_games} icon={<Trophy style={{ width: '20px', height: '20px' }} />} color="blue" />
                <StatCard title="胜率" value={`${playerStats.win_rate.toFixed(1)}%`} icon={<TrendingUp style={{ width: '20px', height: '20px' }} />} color="green" />
                <StatCard title="平均得分" value={playerStats.average_score.toFixed(1)} icon={<Target style={{ width: '20px', height: '20px' }} />} color="purple" />
                <StatCard title="排名" value={`#${overallPerformance.rank}`} icon={<Award style={{ width: '20px', height: '20px' }} />} color="yellow" />
              </div>

              {/* 第二行统计卡片 */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard title="平均时长" value={`${Math.floor(playerStats.average_duration / 60)}分钟`} icon={<Clock style={{ width: '20px', height: '20px' }} />} color="cyan" />
                <StatCard title="最长连胜" value={playerStats.longest_win_streak} icon={<Flame style={{ width: '20px', height: '20px' }} />} color="red" />
                <StatCard title="炸弹使用" value={playerStats.total_bombs_used} icon={<Zap style={{ width: '20px', height: '20px' }} />} color="orange" />
                <StatCard title="火箭使用" value={playerStats.total_rockets_used} icon={<Award style={{ width: '20px', height: '20px' }} />} color="pink" />
              </div>

              {/* 趋势分析 */}
              <InlineCard style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#111827' }}>
                  趋势分析
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>胜率趋势</h4>
                    <div style={{ height: '128px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                      {trends.win_rate_trend.map((rate, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            backgroundColor: '#3b82f6',
                            borderRadius: '4px 4px 0 0',
                            height: `${rate}%`,
                          }}
                          title={`${rate.toFixed(1)}%`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#374151' }}>得分趋势</h4>
                    <div style={{ height: '128px', display: 'flex', alignItems: 'flex-end', gap: '2px' }}>
                      {trends.score_trend.map((score, i) => (
                        <div
                          key={i}
                          style={{
                            flex: 1,
                            backgroundColor: '#22c55e',
                            borderRadius: '4px 4px 0 0',
                            height: `${Math.min(score, 200) / 2}px`,
                          }}
                          title={`${score.toFixed(1)}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </InlineCard>
            </div>
          )}

          {/* 其他标签占位 */}
          {activeTab !== 'overview' && (
            <InlineCard style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>
                该功能正在开发中，敬请期待...
              </p>
            </InlineCard>
          )}
        </main>
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}
