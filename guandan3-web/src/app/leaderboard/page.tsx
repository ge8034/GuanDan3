'use client'

import { useState, useEffect, useCallback } from 'react'
import { Avatar } from '@/design-system/components/atoms'
import { Button } from '@/design-system/components/atoms'
import { Badge } from '@/design-system/components/atoms'
import { Card } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'
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

// 排名按钮组件
function SortButton({
  active,
  value,
  icon,
  label,
  onClick
}: {
  active: boolean
  value: SortBy
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2',
        'min-h-[36px] text-sm font-medium cursor-pointer',
        'transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]',
        active
          ? 'bg-primary text-white border-primary'
          : 'bg-white/80 text-neutral-700 border-transparent hover:bg-neutral-50 hover:border-neutral-200'
      )}
    >
      {icon}
      {label}
    </button>
  )
}

// 骨架屏行
function TableRowSkeleton() {
  return (
    <tr>
      {[...Array(13)].map((_, i) => (
        <td key={i} className="p-3">
          <div className="h-10 bg-neutral-200 rounded animate-pulse" />
        </td>
      ))}
    </tr>
  )
}

export default function LeaderboardPage() {
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
    if (rank === 1) return 'text-warning' // 金色
    if (rank === 2) return 'text-neutral-400' // 银色
    if (rank === 3) return 'text-error' // 铜色
    return 'text-neutral-700'
  }, [])

  const getWinRateVariant = useCallback((winRate: number): 'success' | 'warning' | 'error' => {
    if (winRate >= 50) return 'success'
    if (winRate >= 30) return 'warning'
    return 'error'
  }, [])

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div className="min-h-screen p-4 md:p-8 pt-20">
        <div className="max-w-6xl mx-auto">
          {/* 主卡片 */}
          <Card variant="elevated" padding="lg">
            {/* 标题和排序按钮 */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
                <Trophy className="w-8 h-8 text-accent-gold" />
                排行榜
              </h1>

              <div className="flex gap-2 flex-wrap">
                <SortButton
                  active={sortBy === 'win_rate'}
                  value="win_rate"
                  icon={<TrendingUp className="w-4 h-4" />}
                  label="胜率"
                  onClick={() => setSortBy('win_rate')}
                />
                <SortButton
                  active={sortBy === 'total_score'}
                  value="total_score"
                  icon={<Star className="w-4 h-4" />}
                  label="得分"
                  onClick={() => setSortBy('total_score')}
                />
                <SortButton
                  active={sortBy === 'total_games'}
                  value="total_games"
                  icon={<Gamepad2 className="w-4 h-4" />}
                  label="场次"
                  onClick={() => setSortBy('total_games')}
                />
              </div>
            </div>

            {/* 表格 */}
            {loading ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <tbody>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <TableRowSkeleton key={i} />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : sortedLeaderboard.length === 0 ? (
              <div className="py-12 text-center">
                <Inbox className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                <p className="text-lg font-semibold text-neutral-700 mb-1">
                  暂无排行榜数据
                </p>
                <p className="text-sm text-neutral-500">快去完成一局游戏吧！</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="w-full">
                  <thead className="bg-neutral-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">排名</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">玩家</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">场次</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">胜/负</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">胜率</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">总得分</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">平均得分</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">炸弹</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">出牌数</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">连胜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeaderboard.map((entry) => (
                      <tr
                        key={entry.userId}
                        className="border-b border-neutral-100 transition-colors duration-150 hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            {entry.rank <= 3 ? (
                              <Award
                                className={cn(
                                  'w-6 h-6',
                                  entry.rank === 1 && 'text-warning fill-current',
                                  entry.rank === 2 && 'text-neutral-400',
                                  entry.rank === 3 && 'text-error'
                                )}
                              />
                            ) : (
                              <span className={cn('text-sm font-bold', getRankColor(entry.rank))}>
                                #{entry.rank}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar
                              alt={entry.nickname}
                              size="md"
                              src={entry.avatar_url}
                            />
                            <span className="font-medium text-neutral-900">{entry.nickname}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-700">{entry.totalGames}</td>
                        <td className="px-4 py-3">
                          <span className="text-success">{entry.totalWins}</span>
                          <span className="text-neutral-400 mx-1">/</span>
                          <span className="text-error">{entry.totalLosses}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('font-semibold', getWinRateVariant(entry.winRate))}>
                            {entry.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-primary">{entry.totalScore}</td>
                        <td className="px-4 py-3 text-neutral-700">{entry.avgScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-neutral-700">{entry.bombsPlayed}</td>
                        <td className="px-4 py-3 text-neutral-700">{entry.cardsPlayed}</td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-warning flex items-center gap-1">
                            <Flame className="w-4 h-4" />
                            {entry.currentStreak}
                          </span>
                          {entry.maxStreak > 0 && (
                            <span className="text-neutral-400 text-xs ml-2">
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
          </Card>
        </div>
      </div>
    </SimpleEnvironmentBackground>
  )
}
