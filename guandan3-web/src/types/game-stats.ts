export interface GameStats {
  id: string
  user_id: string
  game_id: string
  game_type: 'ranked' | 'casual' | 'practice'
  result: 'win' | 'lose' | 'draw'
  team_score: number
  opponent_score: number
  duration: number
  cards_played: number
  tricks_won: number
  bombs_used: number
  rockets_used: number
  perfect_rounds: number
  created_at: string
}

export interface PlayerStats {
  id: string
  user_id: string
  total_games: number
  wins: number
  losses: number
  draws: number
  win_rate: number
  total_score: number
  average_score: number
  total_duration: number
  average_duration: number
  total_cards_played: number
  total_tricks_won: number
  total_bombs_used: number
  total_rockets_used: number
  perfect_games: number
  longest_win_streak: number
  current_win_streak: number
  rank_points: number
  rank: number
  created_at: string
  updated_at: string
}

export interface CardPlayStats {
  id: string
  user_id: string
  card_rank: string
  card_suit: string
  play_count: number
  win_count: number
  lose_count: number
  win_rate: number
  average_position: number
  created_at: string
  updated_at: string
}

export interface TeamStats {
  id: string
  user_id: string
  team_mate_id: string
  total_games: number
  wins: number
  losses: number
  win_rate: number
  average_score: number
  total_duration: number
  average_duration: number
  synergy_score: number
  created_at: string
  updated_at: string
}

export interface TimeStats {
  id: string
  user_id: string
  hour: number
  day_of_week: number
  games_played: number
  wins: number
  losses: number
  win_rate: number
  average_score: number
  total_duration: number
  created_at: string
}

export interface AchievementStats {
  id: string
  user_id: string
  achievement_id: string
  achievement_type: 'first_win' | 'win_streak' | 'perfect_game' | 'high_score' | 'long_game' | 'quick_win' | 'bomb_master' | 'rocket_master'
  achieved_at: string
  progress: number
  max_progress: number
  metadata?: Record<string, any>
}

export interface StatsSummary {
  player_stats: PlayerStats
  recent_games: GameStats[]
  card_play_stats: CardPlayStats[]
  team_stats: TeamStats[]
  time_stats: TimeStats[]
  achievements: AchievementStats[]
  trends: {
    win_rate_trend: number[]
    score_trend: number[]
    duration_trend: number[]
  }
}

export interface StatsFilters {
  date_range?: {
    start: string
    end: string
  }
  game_type?: 'ranked' | 'casual' | 'practice' | 'all'
  opponent_id?: string
  team_mate_id?: string
  min_score?: number
  max_score?: number
}

export interface StatsAnalysis {
  overall_performance: {
    total_games: number
    win_rate: number
    average_score: number
    average_duration: number
    rank: number
    rank_change: number
  }
  strengths: string[]
  weaknesses: string[]
  recommendations: string[]
  comparison: {
    vs_average: {
      win_rate: number
      score: number
      duration: number
    }
    vs_top_players: {
      win_rate: number
      score: number
      duration: number
    }
  }
}
