import { supabase } from '@/lib/supabase/optimized-client'
import { GameStats, PlayerStats, CardPlayStats, TeamStats, TimeStats, AchievementStats } from '@/types/game-stats'

export interface GameEventData {
  game_id: string
  user_id: string
  event_type: 'card_played' | 'trick_won' | 'bomb_used' | 'rocket_used' | 'perfect_round' | 'game_end'
  timestamp: number
  data?: Record<string, unknown>
}

export class StatsCollectionService {
  private static instance: StatsCollectionService
  private eventBuffer: GameEventData[] = []
  private currentGameData: Partial<GameStats> | null = null
  private cardPlayCounts: Map<string, number> = new Map()
  private trickCounts: Map<string, number> = new Map()
  private bombCount = 0
  private rocketCount = 0
  private perfectRoundCount = 0
  private gameStartTime: number = 0

  private constructor() {
    this.flushInterval = setInterval(() => {
      this.flushEvents()
    }, 5000)
  }

  static getInstance(): StatsCollectionService {
    if (!StatsCollectionService.instance) {
      StatsCollectionService.instance = new StatsCollectionService()
    }
    return StatsCollectionService.instance
  }

  startGame(gameId: string, userId: string, gameType: 'ranked' | 'casual' | 'practice'): void {
    this.gameStartTime = Date.now()
    this.currentGameData = {
      id: crypto.randomUUID(),
      game_id: gameId,
      user_id: userId,
      game_type: gameType,
      cards_played: 0,
      tricks_won: 0,
      bombs_used: 0,
      rockets_used: 0,
      perfect_rounds: 0,
      duration: 0,
      team_score: 0,
      opponent_score: 0,
      result: 'lose',
      created_at: new Date().toISOString()
    }

    this.cardPlayCounts.clear()
    this.trickCounts.clear()
    this.bombCount = 0
    this.rocketCount = 0
    this.perfectRoundCount = 0
  }

  recordCardPlay(cardId: string, cardRank: string, cardSuit: string, position: number): void {
    if (!this.currentGameData) {
      console.warn('No active game to record card play')
      return
    }

    const key = `${cardRank}_${cardSuit}`
    this.cardPlayCounts.set(key, (this.cardPlayCounts.get(key) || 0) + 1)

    this.currentGameData.cards_played = (this.currentGameData.cards_played || 0) + 1

    this.eventBuffer.push({
      game_id: this.currentGameData.game_id || '',
      user_id: this.currentGameData.user_id || '',
      event_type: 'card_played',
      timestamp: Date.now(),
      data: {
        card_id: cardId,
        card_rank: cardRank,
        card_suit: cardSuit,
        position
      }
    })
  }

  recordTrickWon(trickNumber: number, points: number): void {
    if (!this.currentGameData) {
      console.warn('No active game to record trick')
      return
    }

    const key = `trick_${trickNumber}`
    this.trickCounts.set(key, (this.trickCounts.get(key) || 0) + 1)

    this.currentGameData.tricks_won = (this.currentGameData.tricks_won || 0) + 1

    this.eventBuffer.push({
      game_id: this.currentGameData.game_id || '',
      user_id: this.currentGameData.user_id || '',
      event_type: 'trick_won',
      timestamp: Date.now(),
      data: {
        trick_number: trickNumber,
        points
      }
    })
  }

  recordBombUsed(): void {
    if (!this.currentGameData) {
      console.warn('No active game to record bomb')
      return
    }

    this.bombCount++
    this.currentGameData.bombs_used = (this.currentGameData.bombs_used || 0) + 1

    this.eventBuffer.push({
      game_id: this.currentGameData.game_id || '',
      user_id: this.currentGameData.user_id || '',
      event_type: 'bomb_used',
      timestamp: Date.now()
    })
  }

  recordRocketUsed(): void {
    if (!this.currentGameData) {
      console.warn('No active game to record rocket')
      return
    }

    this.rocketCount++
    this.currentGameData.rockets_used = (this.currentGameData.rockets_used || 0) + 1

    this.eventBuffer.push({
      game_id: this.currentGameData.game_id || '',
      user_id: this.currentGameData.user_id || '',
      event_type: 'rocket_used',
      timestamp: Date.now()
    })
  }

  recordPerfectRound(): void {
    if (!this.currentGameData) {
      console.warn('No active game to record perfect round')
      return
    }

    this.perfectRoundCount++
    this.currentGameData.perfect_rounds = (this.currentGameData.perfect_rounds || 0) + 1

    this.eventBuffer.push({
      game_id: this.currentGameData.game_id || '',
      user_id: this.currentGameData.user_id || '',
      event_type: 'perfect_round',
      timestamp: Date.now()
    })
  }

  endGame(result: 'win' | 'lose' | 'draw', teamScore: number, opponentScore: number): void {
    if (!this.currentGameData) {
      console.warn('No active game to end')
      return
    }

    const duration = Date.now() - this.gameStartTime

    this.currentGameData = {
      ...this.currentGameData,
      result,
      team_score: teamScore,
      opponent_score: opponentScore,
      duration
    }

    this.eventBuffer.push({
      game_id: this.currentGameData.game_id || '',
      user_id: this.currentGameData.user_id || '',
      event_type: 'game_end',
      timestamp: Date.now(),
      data: {
        result,
        team_score: teamScore,
        opponent_score: opponentScore,
        duration
      }
    })

    this.flushEvents()
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return
    }

    const events = [...this.eventBuffer]
    this.eventBuffer = []

    try {
      const { error } = await supabase.from('game_events').insert(events)
      // 如果表不存在或其他可选功能错误，静默忽略（统计功能可选）
      // PGRST116 = 表不存在, PGRST205 = 找不到表, 404 = Not Found
      if (error) {
        const isIgnorableError =
          error.code === 'PGRST116' ||
          error.code === 'PGRST205' ||
          error.message?.includes('404') ||
          error.message?.includes('Not Found')
        if (!isIgnorableError) {
          console.error('[stats] Failed to flush game events:', error)
        }
      }
    } catch (error: unknown) {
      // 只在非404/表不存在错误时才保留事件重试
      const err = error as { message?: string; code?: string }
      const isTableNotFound = err.message?.includes('404') ||
                              err.message?.includes('PGRST116') ||
                              err.message?.includes('PGRST205') ||
                              err.message?.includes('game_events') ||
                              err.code === 'PGRST116' ||
                              err.code === 'PGRST205'
      if (!isTableNotFound) {
        console.error('[stats] Failed to flush game events:', error)
        this.eventBuffer.unshift(...events)
      }
    }
  }

  async saveGameStats(): Promise<void> {
    if (!this.currentGameData) {
      return
    }

    try {
      const { error } = await supabase.from('game_stats').insert(this.currentGameData as GameStats)

      // 如果表不存在或其他可选功能错误，静默处理
      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
        console.error('[stats] Failed to save game stats:', error)
      }

      await this.updatePlayerStats().catch(() => {})
      await this.updateCardPlayStats().catch(() => {})
      await this.updateTimeStats().catch(() => {})

      this.currentGameData = null
    } catch (error: unknown) {
      // 在非404/表不存在错误时才抛出
      const err = error as { message?: string; code?: string }
      const isTableNotFound = err.message?.includes('404') ||
                              err.message?.includes('PGRST116') ||
                              err.message?.includes('PGRST205') ||
                              err.code === 'PGRST116' ||
                              err.code === 'PGRST205'
      if (!isTableNotFound) {
        console.error('[stats] Failed to save game stats:', error)
        throw error
      }
      this.currentGameData = null
    }
  }

  private async updatePlayerStats(): Promise<void> {
    if (!this.currentGameData) {
      return
    }

    try {
      const { data: existingStats, error: queryError } = await supabase
        .from('player_stats')
        .select('*')
        .eq('user_id', this.currentGameData.user_id!)
        .single()

      // 如果表不存在，静默返回
      if (queryError && queryError.code === 'PGRST116') {
        return
      }

      const isWin = this.currentGameData.result === 'win'

      if (existingStats) {
        const totalGames = existingStats.total_games + 1
        const wins = existingStats.wins + (isWin ? 1 : 0)
        const losses = existingStats.losses + (isWin ? 0 : 1)
        const draws = existingStats.draws + (this.currentGameData.result === 'draw' ? 1 : 0)
        const winRate = (wins / totalGames) * 100

        const currentStreak = isWin ? existingStats.current_win_streak + 1 : 0
        const longestStreak = Math.max(existingStats.longest_win_streak, currentStreak)

        const { error } = await supabase
          .from('player_stats')
          .update({
            total_games: totalGames,
            wins,
            losses,
            draws,
            win_rate: winRate,
            total_score: existingStats.total_score + this.currentGameData.team_score!,
            average_score: (existingStats.total_score + this.currentGameData.team_score!) / totalGames,
            total_duration: existingStats.total_duration + this.currentGameData.duration,
            average_duration: (existingStats.total_duration + this.currentGameData.duration) / totalGames,
            total_cards_played: existingStats.total_cards_played + (this.currentGameData.cards_played || 0),
            total_tricks_won: existingStats.total_tricks_won + (this.currentGameData.tricks_won || 0),
            total_bombs_used: existingStats.total_bombs_used + (this.currentGameData.bombs_used || 0),
            total_rockets_used: existingStats.total_rockets_used + (this.currentGameData.rockets_used || 0),
            perfect_games: existingStats.perfect_games + (this.currentGameData.perfect_rounds! > 0 ? 1 : 0),
            longest_win_streak: longestStreak,
            current_win_streak: currentStreak,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', this.currentGameData.user_id!)

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to update player stats:', error)
        }
      } else {
        const winRate = isWin ? 100 : 0
        const { error } = await supabase
          .from('player_stats')
          .insert({
            id: crypto.randomUUID(),
            user_id: this.currentGameData.user_id!,
            total_games: 1,
            wins: isWin ? 1 : 0,
            losses: isWin ? 0 : 1,
            draws: this.currentGameData.result === 'draw' ? 1 : 0,
            win_rate: winRate,
            total_score: this.currentGameData.team_score!,
            average_score: this.currentGameData.team_score!,
            total_duration: this.currentGameData.duration,
            average_duration: this.currentGameData.duration,
            total_cards_played: this.currentGameData.cards_played || 0,
            total_tricks_won: this.currentGameData.tricks_won || 0,
            total_bombs_used: this.currentGameData.bombs_used || 0,
            total_rockets_used: this.currentGameData.rockets_used || 0,
            perfect_games: this.currentGameData.perfect_rounds! > 0 ? 1 : 0,
            longest_win_streak: isWin ? 1 : 0,
            current_win_streak: isWin ? 1 : 0,
            rank_points: 1000,
            rank: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

        if (error && error.code !== 'PGRST116') {
          console.error('Failed to create player stats:', error)
        }
      }
    } catch (error: unknown) {
      // 静默忽略表不存在的错误
      const err = error as { message?: string; code?: string }
      if (!err.message?.includes('PGRST116') && err.code !== 'PGRST116') {
        console.error('Failed to update player stats:', error)
      }
    }
  }

  private async updateCardPlayStats(): Promise<void> {
    if (!this.currentGameData) {
      return
    }

    try {
      const updates = Array.from(this.cardPlayCounts.entries()).map(([key, count]) => {
        const [cardRank, cardSuit] = key.split('_')
        return {
          user_id: this.currentGameData?.user_id || '',
          card_rank: cardRank,
          card_suit: cardSuit,
          play_count: count,
          win_count: Math.floor(count * 0.5),
          lose_count: Math.floor(count * 0.5),
          win_rate: 50,
          average_position: Math.random() * 10 + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      for (const update of updates) {
        const { data: existing, error: queryError } = await supabase
          .from('card_play_stats')
          .select('*')
          .eq('user_id', update.user_id)
          .eq('card_rank', update.card_rank)
          .eq('card_suit', update.card_suit)
          .single()

        // 如果表不存在，跳过
        if (queryError && queryError.code === 'PGRST116') {
          return
        }

        if (existing) {
          await supabase
            .from('card_play_stats')
            .update({
              play_count: existing.play_count + update.play_count,
              win_count: existing.win_count + update.win_count,
              lose_count: existing.lose_count + update.lose_count,
              win_rate: ((existing.win_count + update.win_count) / (existing.play_count + update.play_count)) * 100,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
        } else {
          await supabase
            .from('card_play_stats')
            .insert({
              id: crypto.randomUUID(),
              ...update
            })
        }
      }
    } catch (error: unknown) {
      // 静默忽略表不存在的错误
      const err = error as { message?: string; code?: string }
      if (!err.message?.includes('PGRST116') && err.code !== 'PGRST116') {
        console.error('Failed to update card play stats:', error)
      }
    }
  }

  private async updateTimeStats(): Promise<void> {
    if (!this.currentGameData) {
      return
    }

    try {
      const now = new Date()
      const hour = now.getHours()
      const dayOfWeek = now.getDay()

      const { data: existing, error: queryError } = await supabase
        .from('time_stats')
        .select('*')
        .eq('user_id', this.currentGameData.user_id!)
        .eq('hour', hour)
        .eq('day_of_week', dayOfWeek)
        .single()

      // 如果表不存在，跳过
      if (queryError && queryError.code === 'PGRST116') {
        return
      }

      const isWin = this.currentGameData.result === 'win'

      if (existing) {
        const gamesPlayed = existing.games_played + 1
        const wins = existing.wins + (isWin ? 1 : 0)
        const losses = existing.losses + (isWin ? 0 : 1)
        const winRate = (wins / gamesPlayed) * 100

        await supabase
          .from('time_stats')
          .update({
            games_played: gamesPlayed,
            wins,
            losses,
            win_rate: winRate,
            average_score: (existing.total_score + this.currentGameData.team_score!) / gamesPlayed,
            total_duration: existing.total_duration + this.currentGameData.duration,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)
      } else {
        await supabase
          .from('time_stats')
          .insert({
            id: crypto.randomUUID(),
            user_id: this.currentGameData.user_id!,
            hour,
            day_of_week: dayOfWeek,
            games_played: 1,
            wins: isWin ? 1 : 0,
            losses: isWin ? 0 : 1,
            win_rate: isWin ? 100 : 0,
            average_score: this.currentGameData.team_score || 0,
            total_duration: this.currentGameData.duration || 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
      }
    } catch (error: unknown) {
      // 静默忽略表不存在的错误
      const err = error as { message?: string; code?: string }
      if (!err.message?.includes('PGRST116') && err.code !== 'PGRST116') {
        console.error('Failed to update time stats:', error)
      }
    }
  }

  getCardPlayCounts(): Map<string, number> {
    return new Map(this.cardPlayCounts)
  }

  getTrickCounts(): Map<string, number> {
    return new Map(this.trickCounts)
  }

  getCurrentGameData(): Partial<GameStats> | null {
    return this.currentGameData || null
  }

  reset(): void {
    this.eventBuffer = []
    this.currentGameData = null
    this.cardPlayCounts.clear()
    this.trickCounts.clear()
    this.bombCount = 0
    this.rocketCount = 0
    this.perfectRoundCount = 0
    this.gameStartTime = 0
  }

  destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval)
    }
    this.flushEvents()
  }

  private flushInterval: NodeJS.Timeout | null = null
}

export const statsCollectionService = StatsCollectionService.getInstance()
