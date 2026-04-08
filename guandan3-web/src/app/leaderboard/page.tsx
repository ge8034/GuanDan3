'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { Trophy, TrendingUp, Star, Gamepad2, Flame, Award, Inbox, ArrowLeft } from 'lucide-react'

// 模拟数据
const mockLeaderboard = [
  { rank: 1, userId: '1', nickname: '牌王小李', avatar_url: '', totalGames: 156, totalWins: 98, totalLosses: 58, winRate: 62.8, totalScore: 3580, avgScore: 22.9, bombsPlayed: 45, cardsPlayed: 2340, currentStreak: 8, maxStreak: 15 },
  { rank: 2, userId: '2', nickname: '高手阿明', avatar_url: '', totalGames: 142, totalWins: 85, totalLosses: 57, winRate: 59.9, totalScore: 3250, avgScore: 22.9, bombsPlayed: 38, cardsPlayed: 2100, currentStreak: 5, maxStreak: 12 },
  { rank: 3, userId: '3', nickname: '掼蛋大师', avatar_url: '', totalGames: 189, totalWins: 105, totalLosses: 84, winRate: 55.6, totalScore: 3100, avgScore: 16.4, bombsPlayed: 52, cardsPlayed: 2890, currentStreak: 3, maxStreak: 10 },
  { rank: 4, userId: '4', nickname: '幸运玩家', avatar_url: '', totalGames: 98, totalWins: 52, totalLosses: 46, winRate: 53.1, totalScore: 2850, avgScore: 29.1, bombsPlayed: 28, cardsPlayed: 1560, currentStreak: 6, maxStreak: 8 },
  { rank: 5, userId: '5', nickname: '稳健派', totalGames: 120, totalWins: 60, totalLosses: 60, winRate: 50.0, totalScore: 2680, avgScore: 22.3, bombsPlayed: 35, cardsPlayed: 1800, currentStreak: 2, maxStreak: 7 },
  { rank: 6, userId: '6', nickname: '新手小王', avatar_url: '', totalGames: 45, totalWins: 18, totalLosses: 27, winRate: 40.0, totalScore: 1200, avgScore: 26.7, bombsPlayed: 12, cardsPlayed: 680, currentStreak: 1, maxStreak: 4 },
  { rank: 7, userId: '7', nickname: '老玩家', totalGames: 189, totalWins: 95, totalLosses: 105, winRate: 47.5, totalScore: 2450, avgScore: 12.3, bombsPlayed: 60, cardsPlayed: 3100, currentStreak: 0, maxStreak: 6 },
]

type LeaderboardEntry = typeof mockLeaderboard[0]

type SortBy = 'win_rate' | 'total_score' | 'total_games'

export default function LeaderboardPage() {
  const router = useRouter()
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard)
  const [sortBy, setSortBy] = useState<SortBy>('win_rate')

  // 模拟加载
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800)
    return () => clearTimeout(timer)
  }, [])

  // 根据排序方式排序数据
  const sortedLeaderboard = [...leaderboard].sort((a, b) => {
    if (sortBy === 'win_rate') return b.winRate - a.winRate
    if (sortBy === 'total_score') return b.totalScore - a.totalScore
    return b.totalGames - a.totalGames
  })

  // 重新分配排名
  sortedLeaderboard.forEach((entry, index) => {
    entry.rank = index + 1
  })

  const getRankColor = useCallback((rank: number) => {
    if (rank === 1) return '#eab308'
    if (rank === 2) return '#9ca3af'
    if (rank === 3) return '#f97316'
    return '#111827'
  }, [])

  const getWinRateColor = useCallback((winRate: number) => {
    if (winRate >= 50) return '#22c55e'
    if (winRate >= 30) return '#f59e0b'
    return '#ef4444'
  }, [])

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div style={{ minHeight: '100vh', padding: '1rem', paddingTop: '80px' }}>
        {/* 头部 */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 10,
            backgroundColor: 'rgba(245, 245, 220, 0.9)',
            backdropFilter: 'blur(8px)',
            borderBottom: '2px solid rgba(0, 0, 0, 0.1)',
            marginBottom: '1rem',
          }}
        >
          <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Trophy style={{ width: '32px', height: '32px', color: '#d4af37' }} />
              排行榜
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
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                minHeight: '36px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)'
                e.currentTarget.style.borderColor = '#d4af37'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} />
              返回大厅
            </button>
          </div>
        </header>

        <div style={{ maxWidth: '80rem', margin: '0 auto' }}>
          {/* 主容器 */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              border: '2px solid #e5e7eb',
              padding: '1.5rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* 排序按钮 */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {(['win_rate', 'total_score', 'total_games'] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    border: '2px solid transparent',
                    backgroundColor: sortBy === option ? '#1a472a' : 'rgba(255, 255, 255, 0.8)',
                    color: sortBy === option ? 'white' : '#374151',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minHeight: '36px',
                  }}
                  onMouseEnter={(e) => {
                    if (sortBy !== option) {
                      e.currentTarget.style.backgroundColor = 'rgba(26, 71, 42, 0.05)'
                      e.currentTarget.style.borderColor = '#2d5a3d'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (sortBy !== option) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'
                      e.currentTarget.style.borderColor = 'transparent'
                    }
                  }}
                >
                  {option === 'win_rate' ? (
                    <><TrendingUp style={{ width: '16px', height: '16px' }} />胜率</>
                  ) : option === 'total_score' ? (
                    <><Star style={{ width: '16px', height: '16px' }} />得分</>
                  ) : (
                    <><Gamepad2 style={{ width: '16px', height: '16px' }} />场次</>
                  )}
                </button>
              ))}
            </div>

            {/* 表格 */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    style={{
                      height: '60px',
                      backgroundColor: 'rgba(255, 255, 255, 0.5)',
                      borderRadius: '8px',
                      border: '2px solid #e5e7eb',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}
                  />
                ))}
              </div>
            ) : sortedLeaderboard.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center' }}>
                <Inbox style={{ width: '64px', height: '64px', margin: '0 auto 1rem', color: '#9ca3af' }} />
                <div style={{ fontSize: '1.125rem', color: '#6b7280', marginBottom: '0.5rem' }}>暂无排行榜数据</div>
                <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>快去完成一局游戏吧！</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#1f2937' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>排名</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>玩家</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>场次</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>胜/负</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>胜率</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>总得分</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>平均得分</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>炸弹</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>出牌数</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.875rem', fontWeight: 600, color: '#1f2937' }}>连胜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeaderboard.map((entry) => (
                      <tr
                        key={entry.userId}
                        style={{
                          borderBottom: '1px solid #e5e7eb',
                          transition: 'background-color 0.2s ease-out'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.02)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', color: getRankColor(entry.rank) }}>
                            {entry.rank <= 3 ? (
                              <Award style={{ width: '24px', height: '24px', strokeWidth: 2.5 }} fill={entry.rank === 1 ? 'currentColor' : 'none'} />
                            ) : (
                              <span style={{ fontSize: '1rem', fontWeight: 700 }}>#{entry.rank}</span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Avatar
                              alt={entry.nickname}
                              size="md"
                              src={entry.avatar_url}
                            />
                            <span style={{ fontWeight: 500, color: '#1f2937' }}>{entry.nickname}</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>{entry.totalGames}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>
                          <span style={{ color: '#22c55e', fontWeight: 500 }}>{entry.totalWins}</span>
                          <span style={{ color: '#6b7280', margin: '0 0.25rem' }}>/</span>
                          <span style={{ color: '#ef4444', fontWeight: 500 }}>{entry.totalLosses}</span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 600, color: getWinRateColor(entry.winRate) }}>
                            {entry.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontWeight: 600, color: '#1a472a' }}>{entry.totalScore}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>{entry.avgScore.toFixed(1)}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>{entry.bombsPlayed}</td>
                        <td style={{ padding: '0.75rem 1rem', color: '#1f2937' }}>{entry.cardsPlayed}</td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 600, color: '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Flame style={{ width: '16px', height: '16px' }} />
                            {entry.currentStreak}
                          </span>
                          {entry.maxStreak > 0 && (
                            <span style={{ color: '#6b7280', fontSize: '0.75rem', marginLeft: '0.5rem' }}>
                              (最高: {entry.maxStreak})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </SimpleEnvironmentBackground>
  )
}
