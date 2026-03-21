export type GameType = 'standard' | 'ranked' | 'custom'
export type GameMode = '2v2' | '3v1' | '1v1'
export type GameStatus = 'completed' | 'abandoned' | 'cancelled'
export type Team = 'team_a' | 'team_b'
export type LeaderboardType = 'overall' | 'weekly' | 'monthly' | 'daily'

export interface GameRecord {
  id: string
  room_id: string
  game_type: GameType
  game_mode: GameMode
  status: GameStatus
  started_at: string
  ended_at: string | null
  duration_seconds: number | null
  winning_team: Team
  final_score: {
    team_a: number
    team_b: number
  }
  level_reached: number
  total_rounds: number
  total_cards_played: number
  total_bombs_played: number
  total_rocket_played: number
  special_events: SpecialEvent[]
  created_at: string
  updated_at: string
}

export interface SpecialEvent {
  type: 'rocket' | 'four_with_two' | 'aircraft' | 'straight_flush' | 'other'
  timestamp: string
  user_id: string
  description: string
}

export interface PlayerStats {
  id: string
  user_id: string
  total_games: number
  total_wins: number
  total_losses: number
  win_rate: number
  team_a_games: number
  team_a_wins: number
  team_b_games: number
  team_b_wins: number
  total_play_time_seconds: number
  avg_game_duration_seconds: number
  longest_game_duration_seconds: number
  shortest_game_duration_seconds: number
  current_level: number
  highest_level: number
  total_level_ups: number
  total_level_downs: number
  total_bombs_played: number
  total_rockets_played: number
  total_straights_played: number
  total_aircraft_played: number
  current_win_streak: number
  longest_win_streak: number
  current_lose_streak: number
  longest_lose_streak: number
  current_rank: number
  highest_rank: number
  total_rank_points: number
  first_game_at: string | null
  last_game_at: string | null
  avg_bombs_per_game: number
  avg_rockets_per_game: number
  avg_straights_per_game: number
  avg_aircraft_per_game: number
}

export interface GameParticipant {
  id: string
  game_record_id: string
  user_id: string
  team: Team
  position: number
  is_winner: boolean
  cards_played: number
  bombs_played: number
  rockets_played: number
  straights_played: number
  aircraft_played: number
  performance_score: number
  mvp: boolean
  level_change: number
  rank_points_change: number
  created_at: string
}

export interface Leaderboard {
  id: string
  leaderboard_type: LeaderboardType
  game_type: GameType
  rankings: LeaderboardRanking[]
  last_updated: string
  created_at: string
  updated_at: string
}

export interface LeaderboardRanking {
  user_id: string
  rank: number
  total_rank_points: number
  total_games: number
  total_wins: number
  win_rate: number
  current_level: number
  longest_win_streak: number
}

export interface PlayerDetailedStats extends PlayerStats {
  avg_bombs_per_game: number
  avg_rockets_per_game: number
  avg_straights_per_game: number
  avg_aircraft_per_game: number
}

export interface RecentGameRecord extends Omit<GameRecord, 'player_info'> {
  player_info: {
    team: Team
    position: number
    is_winner: boolean
    cards_played: number
    bombs_played: number
    rockets_played: number
    performance_score: number
    mvp: boolean
    level_change: number
    rank_points_change: number
  }
}

export interface GameRecordInput {
  room_id: string
  game_type: GameType
  game_mode: GameMode
  winning_team: Team
  final_score: {
    team_a: number
    team_b: number
  }
  level_reached: number
  total_rounds: number
  total_cards_played: number
  total_bombs_played: number
  total_rocket_played: number
  special_events: SpecialEvent[]
  participants: GameParticipantInput[]
}

export interface GameParticipantInput {
  user_id: string
  team: Team
  position: number
  is_winner: boolean
  cards_played: number
  bombs_played: number
  rockets_played: number
  straights_played: number
  aircraft_played: number
  performance_score: number
  mvp: boolean
  level_change: number
  rank_points_change: number
}

export interface StatsFilter {
  game_type?: GameType
  game_mode?: GameMode
  date_from?: string
  date_to?: string
  team?: Team
}

export interface LeaderboardFilter {
  leaderboard_type: LeaderboardType
  game_type?: GameType
  limit?: number
}
