import { supabase } from '../supabase/client'

export interface GameStat {
  stat_id: string
  game_id: string | null
  room_id: string | null
  is_ai_game: boolean
  team_score: number
  opponent_score: number
  result: 'win' | 'lose' | 'draw'
  seat_no: number
  level_rank: number
  cards_played: number
  bombs_played: number
  game_duration_seconds: number | null
  created_at: string
}

export interface DailyStat {
  date: string
  games_played: number
  games_won: number
  games_lost: number
  total_score: number
  bombs_played: number
  cards_played: number
  game_duration_seconds: number
}

export interface LeaderboardEntry {
  rank: number
  user_id: string
  nickname: string
  avatar_url: string | null
  total_games: number
  total_wins: number
  total_losses: number
  win_rate: number
  total_score: number
  avg_score: number
  current_streak: number
  max_streak: number
  bombs_played: number
  cards_played: number
}

export interface UserSummaryStats {
  total_games: number
  total_wins: number
  total_losses: number
  win_rate: number
  total_score: number
  avg_score: number
  total_bombs: number
  total_cards: number
  avg_game_duration: number
  current_streak: number
  max_streak: number
}

export async function recordGameStats(params: {
  userId: string
  gameId?: string
  roomId?: string
  isAiGame: boolean
  teamScore: number
  opponentScore: number
  result: 'win' | 'lose' | 'draw'
  seatNo: number
  levelRank: number
  cardsPlayed?: number
  bombsPlayed?: number
  gameDurationSeconds?: number
}): Promise<{ data: string | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('record_game_stats', {
      p_user_id: params.userId,
      p_game_id: params.gameId || null,
      p_room_id: params.roomId || null,
      p_is_ai_game: params.isAiGame,
      p_team_score: params.teamScore,
      p_opponent_score: params.opponentScore,
      p_result: params.result,
      p_seat_no: params.seatNo,
      p_level_rank: params.levelRank,
      p_cards_played: params.cardsPlayed || 0,
      p_bombs_played: params.bombsPlayed || 0,
      p_game_duration_seconds: params.gameDurationSeconds || null
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '记录战绩失败' }
  }
}

export async function getUserGameStats(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ data: GameStat[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_user_game_stats', {
      p_user_id: userId,
      p_limit: limit,
      p_offset: offset
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取游戏战绩失败' }
  }
}

export async function getUserSummaryStats(
  userId: string
): Promise<{ data: UserSummaryStats | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_user_summary_stats', {
      p_user_id: userId
    })

    if (error) {
      return { data: null, error: error.message }
    }

    if (data && data.length > 0) {
      return { data: data[0] }
    }

    return { data: null }
  } catch (error) {
    return { data: null, error: '获取用户统计失败' }
  }
}

export async function getLeaderboard(
  limit: number = 100,
  offset: number = 0,
  sortBy: 'win_rate' | 'total_score' | 'total_games' = 'win_rate'
): Promise<{ data: LeaderboardEntry[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      p_limit: limit,
      p_offset: offset,
      p_sort_by: sortBy
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取排行榜失败' }
  }
}

export async function getDailyStats(
  userId: string,
  days: number = 7
): Promise<{ data: DailyStat[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_daily_stats', {
      p_user_id: userId,
      p_days: days
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取每日统计失败' }
  }
}

export function exportStatsToCSV(stats: GameStat[]): string {
  if (stats.length === 0) return ''

  const headers = [
    '游戏ID',
    '房间ID',
    'AI游戏',
    '队伍得分',
    '对手得分',
    '结果',
    '座位号',
    '级牌',
    '出牌数',
    '炸弹数',
    '游戏时长(秒)',
    '创建时间'
  ]

  const rows = stats.map(stat => [
    stat.game_id || '',
    stat.room_id || '',
    stat.is_ai_game ? '是' : '否',
    stat.team_score,
    stat.opponent_score,
    stat.result === 'win' ? '胜利' : stat.result === 'lose' ? '失败' : '平局',
    stat.seat_no,
    stat.level_rank,
    stat.cards_played,
    stat.bombs_played,
    stat.game_duration_seconds || '',
    new Date(stat.created_at).toLocaleString('zh-CN')
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

export function exportStatsToJSON(stats: GameStat[]): string {
  return JSON.stringify(stats, null, 2)
}

export function downloadStats(content: string, filename: string, type: 'csv' | 'json') {
  const blob = new Blob([content], { type: type === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function shareStats(stats: GameStat[], summary: UserSummaryStats): string {
  const shareText = `🎮 我的掼蛋战绩

📊 总体统计：
• 总场次：${summary.total_games}
• 胜场：${summary.total_wins}
• 负场：${summary.total_losses}
• 胜率：${summary.win_rate.toFixed(1)}%
• 总得分：${summary.total_score}
• 平均得分：${summary.avg_score.toFixed(1)}
• 炸弹数：${summary.total_bombs}
• 出牌数：${summary.total_cards}
• 当前连胜：${summary.current_streak}
• 最高连胜：${summary.max_streak}

🎯 最近战绩：
${stats.slice(0, 5).map((stat, index) => 
  `${index + 1}. ${stat.result === 'win' ? '✅' : '❌'} ${stat.team_score} vs ${stat.opponent_score} (${new Date(stat.created_at).toLocaleDateString('zh-CN')})`
).join('\n')}

#掼蛋 #战绩分享`

  return shareText
}
