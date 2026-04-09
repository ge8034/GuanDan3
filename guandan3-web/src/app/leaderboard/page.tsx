/**
 * Leaderboard 排行榜页面
 * 使用设计系统组件重构版本
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, Button, Card } from '@/design-system/components/atoms'
import SimpleEnvironmentBackground from '@/components/backgrounds/SimpleEnvironmentBackground'
import { useTheme } from '@/lib/theme/theme-context'
import { Trophy, TrendingUp, Star, Gamepad2, Flame, Award, Inbox, ArrowLeft } from 'lucide-react'
import { cn } from '@/design-system/utils/cn'

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
    if (rank === 1) return 'text-amber-500'
    if (rank === 2) return 'text-neutral-400'
    if (rank === 3) return 'text-orange-500'
    return 'text-neutral-900'
  }, [])

  const getWinRateColor = useCallback((winRate: number) => {
    if (winRate >= 50) return 'text-success-600'
    if (winRate >= 30) return 'text-amber-500'
    return 'text-error-600'
  }, [])

  return (
    <SimpleEnvironmentBackground theme={theme}>
      <div className="min-h-screen p-4 pt-20">
        {/* 头部 */}
        <header className="sticky top-0 z-10 bg-amber-50/90 backdrop-blur-md border-b-2 border-black/10 mb-4">
          <div className="max-w-5xl mx-auto px-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
              <Trophy className="w-8 h-8 text-amber-500" />
              排行榜
            </h1>
            <Button
              onClick={() => router.push('/lobby')}
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              返回大厅
            </Button>
          </div>
        </header>

        <div className="max-w-5xl mx-auto">
          {/* 主容器 */}
          <Card className="bg-white/90 backdrop-blur-md border-2 border-neutral-200 p-6">
            {/* 排序按钮 */}
            <div className="flex justify-end gap-2 flex-wrap mb-6">
              {(['win_rate', 'total_score', 'total_games'] as const).map((option) => (
                <Button
                  key={option}
                  onClick={() => setSortBy(option)}
                  variant={sortBy === option ? 'primary' : 'ghost'}
                  size="sm"
                  leftIcon={
                    option === 'win_rate' ? <TrendingUp className="w-4 h-4" /> :
                    option === 'total_score' ? <Star className="w-4 h-4" /> :
                    <Gamepad2 className="w-4 h-4" />
                  }
                >
                  {option === 'win_rate' ? '胜率' : option === 'total_score' ? '得分' : '场次'}
                </Button>
              ))}
            </div>

            {/* 表格 */}
            {loading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="h-16 bg-white/50 rounded-lg border-2 border-neutral-200 animate-pulse" />
                ))}
              </div>
            ) : sortedLeaderboard.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="w-16 h-16 mx-auto mb-4 text-neutral-400" />
                <div className="text-lg text-neutral-600 mb-2">暂无排行榜数据</div>
                <p className="text-sm text-neutral-400">快去完成一局游戏吧！</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-neutral-800">
                  <thead>
                    <tr className="border-b-2 border-neutral-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">排名</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">玩家</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">场次</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">胜/负</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">胜率</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">总得分</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">平均得分</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">炸弹</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">出牌数</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-800">连胜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLeaderboard.map((entry) => (
                      <tr
                        key={entry.userId}
                        className="border-b border-neutral-200 transition-colors hover:bg-black/5"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center w-8 h-8">
                            {entry.rank <= 3 ? (
                              <Award className={cn(
                                "w-6 h-6",
                                entry.rank === 1 && "text-amber-500 fill-current",
                                entry.rank === 2 && "text-neutral-400",
                                entry.rank === 3 && "text-orange-500"
                              )} strokeWidth={2.5} />
                            ) : (
                              <span className="text-base font-bold text-neutral-900">#{entry.rank}</span>
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
                            <span className="font-medium text-neutral-800">{entry.nickname}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-neutral-800">{entry.totalGames}</td>
                        <td className="px-4 py-3 text-neutral-800">
                          <span className="text-success-600 font-semibold">{entry.totalWins}</span>
                          <span className="text-neutral-500 mx-2">/</span>
                          <span className="text-error-600 font-semibold">{entry.totalLosses}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "font-semibold",
                            getWinRateColor(entry.winRate)
                          )}>
                            {entry.winRate.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-poker-table-800">{entry.totalScore}</td>
                        <td className="px-4 py-3 text-neutral-800">{entry.avgScore.toFixed(1)}</td>
                        <td className="px-4 py-3 text-neutral-800">{entry.bombsPlayed}</td>
                        <td className="px-4 py-3 text-neutral-800">{entry.cardsPlayed}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "font-semibold text-amber-500 inline-flex items-center gap-1"
                          )}>
                            <Flame className="w-4 h-4" />
                            {entry.currentStreak}
                          </span>
                          {entry.maxStreak > 0 && (
                            <span className="text-neutral-500 text-xs ml-2">
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
