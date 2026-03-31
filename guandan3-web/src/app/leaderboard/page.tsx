'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getLeaderboard, type LeaderboardEntry } from '@/lib/api/gameStats'
import { RippleEffect } from '@/components/effects/RippleEffect.lazy'

import { logger } from '@/lib/utils/logger'
export default function LeaderboardPage() {
  const [loading, setLoading] = useState(true)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [sortBy, setSortBy] = useState<'win_rate' | 'total_score' | 'total_games'>('win_rate')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const loadLeaderboard = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getLeaderboard(pageSize, (page - 1) * pageSize, sortBy)
      if (data) {
        setLeaderboard(data)
      }
    } catch (error) {
      logger.error('加载排行榜失败:', error)
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, sortBy])

  useEffect(() => {
    loadLeaderboard()
  }, [loadLeaderboard])

  const totalPages = Math.ceil(leaderboard.length / pageSize)

  const getRankBadge = useCallback((rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }, [])

  const getRankColor = useCallback((rank: number) => {
    if (rank === 1) return 'text-yellow-400'
    if (rank === 2) return 'text-gray-300'
    if (rank === 3) return 'text-orange-400'
    return 'text-white'
  }, [])

  const renderLeaderboardRow = useCallback((entry: LeaderboardEntry) => (
    <tr key={entry.user_id} className="border-b border-white/10 hover:bg-white/5">
      <td className="px-4 py-3">
        <span className={`text-2xl font-bold ${getRankColor(entry.rank)}`}>
          {getRankBadge(entry.rank)}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          {entry.avatar_url ? (
            <Image
              src={entry.avatar_url}
              alt={entry.nickname}
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
              {entry.nickname.charAt(0)}
            </div>
          )}
          <span className="font-medium">{entry.nickname}</span>
        </div>
      </td>
      <td className="px-4 py-3">{entry.total_games}</td>
      <td className="px-4 py-3">
        <span className="text-green-400">{entry.total_wins}</span>
        <span className="text-white/40 mx-1">/</span>
        <span className="text-red-400">{entry.total_losses}</span>
      </td>
      <td className="px-4 py-3">
        <span className={`font-bold ${entry.win_rate >= 50 ? 'text-green-400' : entry.win_rate >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
          {entry.win_rate.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 font-bold text-yellow-400">{entry.total_score}</td>
      <td className="px-4 py-3">{entry.avg_score.toFixed(1)}</td>
      <td className="px-4 py-3">{entry.bombs_played}</td>
      <td className="px-4 py-3">{entry.cards_played}</td>
      <td className="px-4 py-3">
        <span className="text-orange-400 font-bold">
          🔥 {entry.current_streak}
        </span>
        {entry.max_streak > 0 && (
          <span className="text-white/60 text-xs ml-2">
            (最高: {entry.max_streak})
          </span>
        )}
      </td>
    </tr>
  ), [getRankBadge, getRankColor])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 p-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">🏆 排行榜</h1>
            <div className="flex gap-2">
              {(['win_rate', 'total_score', 'total_games'] as const).map((option) => (
                <RippleEffect key={option} className="relative inline-block">
                  <button
                    onClick={() => {
                      setSortBy(option)
                      setPage(1)
                    }}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      sortBy === option 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {option === 'win_rate' ? '📊 胜率' : 
                     option === 'total_score' ? '⭐ 得分' : 
                     '🎮 场次'}
                  </button>
                </RippleEffect>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center text-white py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-r-2 border-t-2 border-l-2 border-white"></div>
              <p className="mt-4">加载中...</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-white">
                  <thead>
                    <tr className="border-b border-white/20">
                      <th className="px-4 py-3 text-left">排名</th>
                      <th className="px-4 py-3 text-left">玩家</th>
                      <th className="px-4 py-3 text-left">场次</th>
                      <th className="px-4 py-3 text-left">胜/负</th>
                      <th className="px-4 py-3 text-left">胜率</th>
                      <th className="px-4 py-3 text-left">总得分</th>
                      <th className="px-4 py-3 text-left">平均得分</th>
                      <th className="px-4 py-3 text-left">炸弹</th>
                      <th className="px-4 py-3 text-left">出牌数</th>
                      <th className="px-4 py-3 text-left">连胜</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map(renderLeaderboardRow)}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex justify-center gap-2 pt-4">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <RippleEffect key={pageNum} className="relative inline-block">
                      <button
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 rounded-lg transition-colors ${
                          page === pageNum 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        }`}
                      >
                        {pageNum}
                      </button>
                    </RippleEffect>
                  ))}
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
