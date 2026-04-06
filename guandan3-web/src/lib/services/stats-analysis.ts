import { supabase } from '@/lib/supabase/optimized-client'
import { PlayerStats, GameStats, CardPlayStats, TeamStats, TimeStats, StatsSummary, StatsFilters, StatsAnalysis } from '@/types/game-stats'

export class StatsAnalysisService {
  private static instance: StatsAnalysisService

  private constructor() {}

  static getInstance(): StatsAnalysisService {
    if (!StatsAnalysisService.instance) {
      StatsAnalysisService.instance = new StatsAnalysisService()
    }
    return StatsAnalysisService.instance
  }

  async getPlayerStats(userId: string, filters?: StatsFilters): Promise<StatsSummary> {
    try {
      const [playerStats, recentGames, cardPlayStats, teamStats, timeStats] = await Promise.all([
        this.fetchPlayerStats(userId),
        this.fetchRecentGames(userId, filters),
        this.fetchCardPlayStats(userId),
        this.fetchTeamStats(userId),
        this.fetchTimeStats(userId)
      ])

      const trends = await this.calculateTrends(userId, filters)

      return {
        player_stats: playerStats,
        recent_games: recentGames,
        card_play_stats: cardPlayStats,
        team_stats: teamStats,
        time_stats: timeStats,
        achievements: [],
        trends
      }
    } catch (error) {
      console.error('Failed to get player stats:', error)
      throw error
    }
  }

  async analyzePlayerPerformance(userId: string): Promise<StatsAnalysis> {
    try {
      const playerStats = await this.fetchPlayerStats(userId)
      const recentGames = await this.fetchRecentGames(userId, { game_type: 'ranked' })
      const allPlayers = await this.fetchAllPlayerStats()

      const overallPerformance = this.calculateOverallPerformance(playerStats, allPlayers)
      const strengths = this.identifyStrengths(playerStats, recentGames)
      const weaknesses = this.identifyWeaknesses(playerStats, recentGames)
      const recommendations = this.generateRecommendations(playerStats, strengths, weaknesses)
      const comparison = this.calculateComparison(playerStats, allPlayers)

      return {
        overall_performance: overallPerformance,
        strengths,
        weaknesses,
        recommendations,
        comparison
      }
    } catch (error) {
      console.error('Failed to analyze player performance:', error)
      throw error
    }
  }

  private async fetchPlayerStats(userId: string): Promise<PlayerStats> {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      throw new Error('Failed to fetch player stats')
    }

    return data
  }

  private async fetchRecentGames(userId: string, filters?: StatsFilters): Promise<GameStats[]> {
    let query = supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (filters?.date_range) {
      query = query.gte('created_at', filters.date_range.start).lte('created_at', filters.date_range.end)
    }

    if (filters?.game_type && filters.game_type !== 'all') {
      query = query.eq('game_type', filters.game_type)
    }

    if (filters?.opponent_id) {
      query = query.eq('opponent_id', filters.opponent_id)
    }

    const { data, error } = await query

    if (error) {
      throw new Error('Failed to fetch recent games')
    }

    return data || []
  }

  private async fetchCardPlayStats(userId: string): Promise<CardPlayStats[]> {
    const { data, error } = await supabase
      .from('card_play_stats')
      .select('*')
      .eq('user_id', userId)
      .order('play_count', { ascending: false })
      .limit(20)

    if (error) {
      throw new Error('Failed to fetch card play stats')
    }

    return data || []
  }

  private async fetchTeamStats(userId: string): Promise<TeamStats[]> {
    const { data, error } = await supabase
      .from('team_stats')
      .select('*')
      .eq('user_id', userId)
      .order('total_games', { ascending: false })
      .limit(10)

    if (error) {
      throw new Error('Failed to fetch team stats')
    }

    return data || []
  }

  private async fetchTimeStats(userId: string): Promise<TimeStats[]> {
    const { data, error } = await supabase
      .from('time_stats')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(168)

    if (error) {
      throw new Error('Failed to fetch time stats')
    }

    return data || []
  }

  private async fetchAllPlayerStats(): Promise<PlayerStats[]> {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .order('rank_points', { ascending: false })
      .limit(100)

    if (error) {
      throw new Error('Failed to fetch all player stats')
    }

    return data || []
  }

  private async calculateTrends(userId: string, filters?: StatsFilters): Promise<{
    win_rate_trend: number[]
    score_trend: number[]
    duration_trend: number[]
  }> {
    const games = await this.fetchRecentGames(userId, filters)
    const sortedGames = games.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )

    const windowSize = 10
    const winRateTrend: number[] = []
    const scoreTrend: number[] = []
    const durationTrend: number[] = []

    for (let i = windowSize; i < sortedGames.length; i++) {
      const windowGames = sortedGames.slice(i - windowSize, i)
      const wins = windowGames.filter(game => game.result === 'win').length
      const winRate = (wins / windowGames.length) * 100
      const avgScore = windowGames.reduce((sum, game) => sum + game.team_score, 0) / windowGames.length
      const avgDuration = windowGames.reduce((sum, game) => sum + game.duration, 0) / windowGames.length

      winRateTrend.push(winRate)
      scoreTrend.push(avgScore)
      durationTrend.push(avgDuration)
    }

    return {
      win_rate_trend: winRateTrend,
      score_trend: scoreTrend,
      duration_trend: durationTrend
    }
  }

  private calculateOverallPerformance(playerStats: PlayerStats, allPlayers: PlayerStats[]) {
    const totalPlayers = allPlayers.length
    const playerRank = allPlayers.findIndex(p => p.user_id === playerStats.user_id) + 1

    const avgWinRate = allPlayers.reduce((sum, p) => sum + p.win_rate, 0) / totalPlayers
    const avgScore = allPlayers.reduce((sum, p) => sum + p.average_score, 0) / totalPlayers
    const avgDuration = allPlayers.reduce((sum, p) => sum + p.average_duration, 0) / totalPlayers

    return {
      total_games: playerStats.total_games,
      win_rate: playerStats.win_rate,
      average_score: playerStats.average_score,
      average_duration: playerStats.average_duration,
      rank: playerRank,
      rank_change: 0
    }
  }

  private identifyStrengths(playerStats: PlayerStats, recentGames: GameStats[]): string[] {
    const strengths: string[] = []

    if (playerStats.win_rate >= 60) {
      strengths.push('胜率较高')
    }

    if (playerStats.average_score >= 100) {
      strengths.push('得分能力强')
    }

    if (playerStats.average_duration <= 600) {
      strengths.push('游戏节奏快')
    }

    if (playerStats.total_bombs_used / playerStats.total_games >= 2) {
      strengths.push('善于使用炸弹')
    }

    if (playerStats.total_rockets_used / playerStats.total_games >= 1) {
      strengths.push('善于使用火箭')
    }

    if (playerStats.longest_win_streak >= 5) {
      strengths.push('连胜能力强')
    }

    if (playerStats.perfect_games / playerStats.total_games >= 0.3) {
      strengths.push('完美局数多')
    }

    const recentWinRate = recentGames.filter(game => game.result === 'win').length / recentGames.length
    if (recentWinRate >= 0.6) {
      strengths.push('近期状态良好')
    }

    return strengths
  }

  private identifyWeaknesses(playerStats: PlayerStats, recentGames: GameStats[]): string[] {
    const weaknesses: string[] = []

    if (playerStats.win_rate < 40) {
      weaknesses.push('胜率偏低')
    }

    if (playerStats.average_score < 50) {
      weaknesses.push('得分能力待提升')
    }

    if (playerStats.average_duration > 900) {
      weaknesses.push('游戏节奏偏慢')
    }

    if (playerStats.total_bombs_used / playerStats.total_games < 1) {
      weaknesses.push('炸弹使用不足')
    }

    if (playerStats.total_rockets_used / playerStats.total_games < 0.5) {
      weaknesses.push('火箭使用不足')
    }

    if (playerStats.current_win_streak < 3 && playerStats.longest_win_streak < 5) {
      weaknesses.push('连胜能力待提升')
    }

    const recentLosses = recentGames.filter(game => game.result === 'lose').length
    if (recentLosses / recentGames.length >= 0.6) {
      weaknesses.push('近期状态不佳')
    }

    return weaknesses
  }

  private generateRecommendations(playerStats: PlayerStats, strengths: string[], weaknesses: string[]): string[] {
    const recommendations: string[] = []

    if (weaknesses.includes('胜率偏低')) {
      recommendations.push('建议多练习基本牌型，提高出牌准确性')
      recommendations.push('注意观察对手出牌模式，制定针对性策略')
    }

    if (weaknesses.includes('得分能力待提升')) {
      recommendations.push('学习高级牌型组合，提高得分效率')
      recommendations.push('在关键时刻合理使用炸弹和火箭')
    }

    if (weaknesses.includes('游戏节奏偏慢')) {
      recommendations.push('提高出牌速度，减少思考时间')
      recommendations.push('熟悉常见牌型，快速做出决策')
    }

    if (weaknesses.includes('炸弹使用不足')) {
      recommendations.push('在适当时候使用炸弹控制局面')
      recommendations.push('注意保留炸弹用于关键时刻')
    }

    if (weaknesses.includes('火箭使用不足')) {
      recommendations.push('合理使用火箭获得额外分数')
      recommendations.push('在对手可能出大牌时使用火箭')
    }

    if (weaknesses.includes('连胜能力待提升')) {
      recommendations.push('保持良好心态，避免连败影响发挥')
      recommendations.push('总结失败经验，持续改进策略')
    }

    if (weaknesses.includes('近期状态不佳')) {
      recommendations.push('适当休息，调整状态后再游戏')
      recommendations.push('分析近期失败原因，针对性改进')
    }

    if (strengths.includes('胜率较高')) {
      recommendations.push('保持当前策略，继续发挥优势')
      recommendations.push('可以尝试更高难度的对局')
    }

    return recommendations
  }

  private calculateComparison(playerStats: PlayerStats, allPlayers: PlayerStats[]) {
    const totalPlayers = allPlayers.length
    const avgWinRate = allPlayers.reduce((sum, p) => sum + p.win_rate, 0) / totalPlayers
    const avgScore = allPlayers.reduce((sum, p) => sum + p.average_score, 0) / totalPlayers
    const avgDuration = allPlayers.reduce((sum, p) => sum + p.average_duration, 0) / totalPlayers

    const topPlayers = allPlayers.slice(0, Math.min(10, totalPlayers))
    const topAvgWinRate = topPlayers.reduce((sum, p) => sum + p.win_rate, 0) / topPlayers.length
    const topAvgScore = topPlayers.reduce((sum, p) => sum + p.average_score, 0) / topPlayers.length
    const topAvgDuration = topPlayers.reduce((sum, p) => sum + p.average_duration, 0) / topPlayers.length

    return {
      vs_average: {
        win_rate: playerStats.win_rate - avgWinRate,
        score: playerStats.average_score - avgScore,
        duration: playerStats.average_duration - avgDuration
      },
      vs_top_players: {
        win_rate: playerStats.win_rate - topAvgWinRate,
        score: playerStats.average_score - topAvgScore,
        duration: playerStats.average_duration - topAvgDuration
      }
    }
  }

  async getLeaderboard(limit: number = 50): Promise<PlayerStats[]> {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .order('rank_points', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error('Failed to fetch leaderboard')
    }

    return data || []
  }

  async getPlayerRank(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('player_stats')
      .select('rank')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return 0
    }

    return data.rank
  }

  async getStatsByTimeRange(userId: string, startDate: string, endDate: string): Promise<GameStats[]> {
    const { data, error } = await supabase
      .from('game_stats')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error('Failed to fetch stats by time range')
    }

    return data || []
  }

  async getCardUsageStats(userId: string): Promise<{
    most_used_cards: CardPlayStats[]
    least_used_cards: CardPlayStats[]
    highest_win_rate_cards: CardPlayStats[]
  }> {
    const cardStats = await this.fetchCardPlayStats(userId)

    return {
      most_used_cards: cardStats.slice(0, 10),
      least_used_cards: cardStats.slice(-10).reverse(),
      highest_win_rate_cards: [...cardStats].sort((a, b) => b.win_rate - a.win_rate).slice(0, 10)
    }
  }

  async getPerformanceInsights(userId: string): Promise<{
    best_time_of_day: { hour: number; winRate: number }
    best_day_of_week: { day: number; winRate: number }
    improvement_suggestions: string[]
  }> {
    const timeStats = await this.fetchTimeStats(userId)

    const hourlyStats = new Map<number, { games: number; wins: number }>()
    const dailyStats = new Map<number, { games: number; wins: number }>()

    timeStats.forEach(stat => {
      const hourKey = stat.hour
      const dayKey = stat.day_of_week

      const hourData = hourlyStats.get(hourKey) || { games: 0, wins: 0 }
      hourData.games += stat.games_played
      hourData.wins += stat.wins
      hourlyStats.set(hourKey, hourData)

      const dayData = dailyStats.get(dayKey) || { games: 0, wins: 0 }
      dayData.games += stat.games_played
      dayData.wins += stat.wins
      dailyStats.set(dayKey, dayData)
    })

    let bestHour = { hour: 0, winRate: 0 }
    hourlyStats.forEach((stats, hour) => {
      const winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0
      if (winRate > bestHour.winRate) {
        bestHour = { hour, winRate }
      }
    })

    let bestDay = { day: 0, winRate: 0 }
    dailyStats.forEach((stats, day) => {
      const winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0
      if (winRate > bestDay.winRate) {
        bestDay = { day, winRate }
      }
    })

    const suggestions = this.generateTimeBasedSuggestions(bestHour, bestDay)

    return {
      best_time_of_day: bestHour,
      best_day_of_week: bestDay,
      improvement_suggestions: suggestions
    }
  }

  private generateTimeBasedSuggestions(bestHour: { hour: number; winRate: number }, bestDay: { day: number; winRate: number }): string[] {
    const suggestions: string[] = []

    const hourNames = ['凌晨', '上午', '中午', '下午', '晚上']
    const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

    if (bestHour.winRate > 60) {
      const timePeriod = hourNames[Math.floor(bestHour.hour / 5)]
      suggestions.push(`你在${timePeriod}时段表现最佳，建议在这个时间段进行游戏`)
    }

    if (bestDay.winRate > 60) {
      suggestions.push(`你在${dayNames[bestDay.day]}表现最佳，建议在这天多进行游戏`)
    }

    if (bestHour.winRate < 40) {
      suggestions.push('建议调整游戏时间，寻找表现更好的时段')
    }

    return suggestions
  }
}

export const statsAnalysisService = StatsAnalysisService.getInstance()
