import { supabase } from '@/lib/supabase/client'
import type {
  GameRecord,
  PlayerStats,
  GameParticipant,
  Leaderboard,
  GameRecordInput,
  StatsFilter,
  LeaderboardFilter,
  RecentGameRecord,
  PlayerDetailedStats
} from '@/types/game-records'

export async function createGameRecord(input: GameRecordInput): Promise<GameRecord | null> {
  try {
    const { data: gameData, error: gameError } = await supabase
      .from('game_records')
      .insert({
        room_id: input.room_id,
        game_type: input.game_type,
        game_mode: input.game_mode,
        winning_team: input.winning_team,
        final_score: input.final_score,
        level_reached: input.level_reached,
        total_rounds: input.total_rounds,
        total_cards_played: input.total_cards_played,
        total_bombs_played: input.total_bombs_played,
        total_rocket_played: input.total_rocket_played,
        special_events: input.special_events
      })
      .select()
      .single()

    if (gameError) throw gameError

    const duration_seconds = input.participants.length > 0 
      ? Math.floor((Date.now() - new Date(gameData.started_at).getTime()) / 1000)
      : null

    const { data: updatedGameData, error: updateError } = await supabase
      .from('game_records')
      .update({
        ended_at: new Date().toISOString(),
        duration_seconds
      })
      .eq('id', gameData.id)
      .select()
      .single()

    if (updateError) throw updateError

    for (const participant of input.participants) {
      await supabase.rpc('update_player_stats', {
        p_user_id: participant.user_id,
        p_team: participant.team,
        p_is_winner: participant.is_winner,
        p_game_duration_seconds: duration_seconds || 0,
        p_level_change: participant.level_change,
        p_rank_points_change: participant.rank_points_change,
        p_cards_played: participant.cards_played,
        p_bombs_played: participant.bombs_played,
        p_rockets_played: participant.rockets_played,
        p_straights_played: participant.straights_played,
        p_aircraft_played: participant.aircraft_played
      })

      await supabase.from('game_participants').insert({
        game_record_id: gameData.id,
        user_id: participant.user_id,
        team: participant.team,
        position: participant.position,
        is_winner: participant.is_winner,
        cards_played: participant.cards_played,
        bombs_played: participant.bombs_played,
        rockets_played: participant.rockets_played,
        straights_played: participant.straights_played,
        aircraft_played: participant.aircraft_played,
        performance_score: participant.performance_score,
        mvp: participant.mvp,
        level_change: participant.level_change,
        rank_points_change: participant.rank_points_change
      })
    }

    await supabase.rpc('update_leaderboard', {
      p_leaderboard_type: 'overall',
      p_game_type: input.game_type
    })

    return updatedGameData
  } catch (error) {
    console.error('Error creating game record:', error)
    return null
  }
}

export async function getPlayerStats(userId: string): Promise<PlayerDetailedStats | null> {
  try {
    const { data, error } = await supabase
      .from('player_detailed_stats')
      .select('id,user_id,total_games,total_wins,total_losses,win_rate,team_a_games,team_a_wins,team_b_games,team_b_wins,total_play_time_seconds,avg_game_duration_seconds,longest_game_duration_seconds,shortest_game_duration_seconds,current_level,highest_level,total_level_ups,total_level_downs,total_bombs_played,total_rockets_played,total_straights_played,total_aircraft_played,current_win_streak,longest_win_streak,current_lose_streak,longest_lose_streak,current_rank,highest_rank,total_rank_points,first_game_at,last_game_at,avg_bombs_per_game,avg_rockets_per_game,avg_straights_per_game,avg_aircraft_per_game')
      .eq('user_id', userId)
      .single()

    if (error) {
      // Log but don't throw - stats are non-critical
      if (error.code !== 'PGRST116' && error.code !== '406') {
        console.warn('[getPlayerStats] Error (non-critical):', error.message)
      }
      return null
    }
    return data
  } catch (error) {
    console.warn('[getPlayerStats] Exception:', error)
    return null
  }
}

export async function getCurrentPlayerStats(): Promise<PlayerDetailedStats | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return getPlayerStats(user.id)
  } catch (error) {
    console.error('Error getting current player stats:', error)
    return null
  }
}

export async function getGameRecords(
  limit: number = 20,
  offset: number = 0
): Promise<RecentGameRecord[]> {
  try {
    const { data, error } = await supabase
      .from('recent_game_records')
      .select('id,room_id,game_type,game_mode,status,started_at,ended_at,duration_seconds,winning_team,final_score,level_reached,total_rounds,total_cards_played,total_bombs_played,total_rocket_played,special_events,player_info,created_at,updated_at')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting game records:', error)
    return []
  }
}

export async function getGameRecordById(id: string): Promise<GameRecord | null> {
  try {
    const { data, error } = await supabase
      .from('game_records')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error getting game record:', error)
    return null
  }
}

export async function getGameParticipants(gameRecordId: string): Promise<GameParticipant[]> {
  try {
    const { data, error } = await supabase
      .from('game_participants')
      .select('*')
      .eq('game_record_id', gameRecordId)
      .order('position')

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error getting game participants:', error)
    return []
  }
}

export async function getLeaderboard(filter: LeaderboardFilter): Promise<Leaderboard | null> {
  try {
    const { data, error } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('leaderboard_type', filter.leaderboard_type)
      .eq('game_type', filter.game_type || 'standard')
      .single()

    if (error) throw error

    if (filter.limit && data.rankings.length > filter.limit) {
      data.rankings = data.rankings.slice(0, filter.limit)
    }

    return data
  } catch (error) {
    console.error('Error getting leaderboard:', error)
    return null
  }
}

export async function getOverallLeaderboard(limit: number = 100): Promise<Leaderboard | null> {
  return getLeaderboard({
    leaderboard_type: 'overall',
    game_type: 'standard',
    limit
  })
}

export async function getWeeklyLeaderboard(limit: number = 100): Promise<Leaderboard | null> {
  return getLeaderboard({
    leaderboard_type: 'weekly',
    game_type: 'standard',
    limit
  })
}

export async function getMonthlyLeaderboard(limit: number = 100): Promise<Leaderboard | null> {
  return getLeaderboard({
    leaderboard_type: 'monthly',
    game_type: 'standard',
    limit
  })
}

export async function getDailyLeaderboard(limit: number = 100): Promise<Leaderboard | null> {
  return getLeaderboard({
    leaderboard_type: 'daily',
    game_type: 'standard',
    limit
  })
}

export async function getPlayerRank(userId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('current_rank')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code !== 'PGRST116' && error.code !== '406') {
        console.warn('[getPlayerRank] Error (non-critical):', error.message)
      }
      return null
    }
    return data.current_rank
  } catch (error) {
    console.warn('[getPlayerRank] Exception:', error)
    return null
  }
}

export async function getCurrentPlayerRank(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return getPlayerRank(user.id)
  } catch (error) {
    console.error('Error getting current player rank:', error)
    return null
  }
}

export async function getTopPlayers(limit: number = 10): Promise<PlayerStats[]> {
  try {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .order('total_rank_points', { ascending: false })
      .limit(limit)

    if (error) {
      if (error.code !== 'PGRST116' && error.code !== '406') {
        console.warn('[getTopPlayers] Error (non-critical):', error.message)
      }
      return []
    }
    return data || []
  } catch (error) {
    console.warn('[getTopPlayers] Exception:', error)
    return []
  }
}

export async function getRecentGames(limit: number = 10): Promise<RecentGameRecord[]> {
  return getGameRecords(limit, 0)
}

export async function getWinLossRatio(userId: string): Promise<{ wins: number; losses: number; ratio: number } | null> {
  try {
    const stats = await getPlayerStats(userId)
    if (!stats) return null

    const ratio = stats.total_losses > 0 
      ? stats.total_wins / stats.total_losses 
      : stats.total_wins > 0 ? Infinity : 0

    return {
      wins: stats.total_wins,
      losses: stats.total_losses,
      ratio
    }
  } catch (error) {
    console.error('Error getting win/loss ratio:', error)
    return null
  }
}

export async function getCurrentPlayerWinLossRatio(): Promise<{ wins: number; losses: number; ratio: number } | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return getWinLossRatio(user.id)
  } catch (error) {
    console.error('Error getting current player win/loss ratio:', error)
    return null
  }
}

export async function getAverageGameDuration(userId: string): Promise<number | null> {
  try {
    const stats = await getPlayerStats(userId)
    if (!stats) return null

    return stats.avg_game_duration_seconds
  } catch (error) {
    console.error('Error getting average game duration:', error)
    return null
  }
}

export async function getCurrentPlayerAverageGameDuration(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return getAverageGameDuration(user.id)
  } catch (error) {
    console.error('Error getting current player average game duration:', error)
    return null
  }
}

export async function getTotalPlayTime(userId: string): Promise<number | null> {
  try {
    const stats = await getPlayerStats(userId)
    if (!stats) return null

    return stats.total_play_time_seconds
  } catch (error) {
    console.error('Error getting total play time:', error)
    return null
  }
}

export async function getCurrentPlayerTotalPlayTime(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return getTotalPlayTime(user.id)
  } catch (error) {
    console.error('Error getting current player total play time:', error)
    return null
  }
}

export async function getLongestWinStreak(userId: string): Promise<number | null> {
  try {
    const stats = await getPlayerStats(userId)
    if (!stats) return null

    return stats.longest_win_streak
  } catch (error) {
    console.error('Error getting longest win streak:', error)
    return null
  }
}

export async function getCurrentPlayerLongestWinStreak(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return getLongestWinStreak(user.id)
  } catch (error) {
    console.error('Error getting current player longest win streak:', error)
    return null
  }
}

export async function getCurrentWinStreak(userId: string): Promise<number | null> {
  try {
    const stats = await getPlayerStats(userId)
    if (!stats) return null

    return stats.current_win_streak
  } catch (error) {
    console.error('Error getting current win streak:', error)
    return null
  }
}

export async function getCurrentPlayerCurrentWinStreak(): Promise<number | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    return getCurrentWinStreak(user.id)
  } catch (error) {
    console.error('Error getting current player current win streak:', error)
    return null
  }
}
