-- ============================================================================
-- 统计和分析表迁移
-- 与 src/types/game-stats.ts 完全对齐
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. game_events 表 - 游戏事件记录
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('card_played', 'trick_won', 'bomb_used', 'rocket_used', 'perfect_round', 'game_end')),
  timestamp BIGINT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_user_id ON public.game_events(user_id);
CREATE INDEX IF NOT EXISTS idx_game_events_event_type ON public.game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_timestamp ON public.game_events(timestamp);

-- ----------------------------------------------------------------------------
-- 2. game_stats 表 - 游戏统计数据
-- 与 GameStats 接口对齐
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('ranked', 'casual', 'practice')),
  result TEXT NOT NULL CHECK (result IN ('win', 'lose', 'draw')),
  team_score INTEGER NOT NULL DEFAULT 0,
  opponent_score INTEGER NOT NULL DEFAULT 0,
  duration BIGINT NOT NULL DEFAULT 0,
  cards_played INTEGER NOT NULL DEFAULT 0,
  tricks_won INTEGER NOT NULL DEFAULT 0,
  bombs_used INTEGER NOT NULL DEFAULT 0,
  rockets_used INTEGER NOT NULL DEFAULT 0,
  perfect_rounds INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_stats_user_id ON public.game_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON public.game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_created_at ON public.game_stats(created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. player_stats 表 - 玩家累计统计
-- 与 PlayerStats 接口对齐
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  total_games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  draws INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_score INTEGER NOT NULL DEFAULT 0,
  average_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_duration BIGINT NOT NULL DEFAULT 0,
  average_duration BIGINT NOT NULL DEFAULT 0,
  total_cards_played INTEGER NOT NULL DEFAULT 0,
  total_tricks_won INTEGER NOT NULL DEFAULT 0,
  total_bombs_used INTEGER NOT NULL DEFAULT 0,
  total_rockets_used INTEGER NOT NULL DEFAULT 0,
  perfect_games INTEGER NOT NULL DEFAULT 0,
  longest_win_streak INTEGER NOT NULL DEFAULT 0,
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  rank_points INTEGER NOT NULL DEFAULT 1000,
  rank INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON public.player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_rank_points ON public.player_stats(rank_points DESC);

-- ----------------------------------------------------------------------------
-- 4. card_play_stats 表 - 卡牌使用统计
-- 与 CardPlayStats 接口对齐
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.card_play_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  card_rank TEXT NOT NULL,
  card_suit TEXT NOT NULL,
  play_count INTEGER NOT NULL DEFAULT 0,
  win_count INTEGER NOT NULL DEFAULT 0,
  lose_count INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_position DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_rank, card_suit)
);

CREATE INDEX IF NOT EXISTS idx_card_play_stats_user_id ON public.card_play_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_card_play_stats_play_count ON public.card_play_stats(play_count DESC);

-- ----------------------------------------------------------------------------
-- 5. time_stats 表 - 时间段统计
-- 与 TimeStats 接口对齐
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.time_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  hour INTEGER NOT NULL CHECK (hour BETWEEN 0 AND 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_duration BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hour, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_time_stats_user_id ON public.time_stats(user_id);

-- ----------------------------------------------------------------------------
-- 6. team_stats 表 - 队友统计
-- 与 TeamStats 接口对齐
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  team_mate_id TEXT NOT NULL,
  total_games INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_duration BIGINT NOT NULL DEFAULT 0,
  average_duration BIGINT NOT NULL DEFAULT 0,
  synergy_score DECIMAL(5,2) NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, team_mate_id)
);

CREATE INDEX IF NOT EXISTS idx_team_stats_user_id ON public.team_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_team_stats_synergy ON public.team_stats(synergy_score DESC);

-- ----------------------------------------------------------------------------
-- 7. achievement_stats 表 - 成就统计
-- 与 AchievementStats 接口对齐
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.achievement_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL CHECK (achievement_type IN (
    'first_win', 'win_streak', 'perfect_game', 'high_score',
    'long_game', 'quick_win', 'bomb_master', 'rocket_master'
  )),
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  progress INTEGER NOT NULL DEFAULT 0,
  max_progress INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_stats_user_id ON public.achievement_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_stats_type ON public.achievement_stats(achievement_type);

-- ----------------------------------------------------------------------------
-- 启用 RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_play_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_stats ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- RLS 策略：用户只能读写自己的数据
-- ----------------------------------------------------------------------------

-- game_events
CREATE POLICY "Users can view own game events"
  ON public.game_events FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own game events"
  ON public.game_events FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- game_stats
CREATE POLICY "Users can view own game stats"
  ON public.game_stats FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own game stats"
  ON public.game_stats FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- player_stats
CREATE POLICY "Users can view own player stats"
  ON public.player_stats FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can upsert own player stats"
  ON public.player_stats FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- card_play_stats
CREATE POLICY "Users can view own card stats"
  ON public.card_play_stats FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can upsert own card stats"
  ON public.card_play_stats FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- time_stats
CREATE POLICY "Users can view own time stats"
  ON public.time_stats FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can upsert own time stats"
  ON public.time_stats FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- team_stats
CREATE POLICY "Users can view own team stats"
  ON public.team_stats FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can upsert own team stats"
  ON public.team_stats FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- achievement_stats
CREATE POLICY "Users can view own achievements"
  ON public.achievement_stats FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can upsert own achievements"
  ON public.achievement_stats FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- ----------------------------------------------------------------------------
-- 服务端角色策略（service_role 可以读取所有数据用于统计分析）
-- ----------------------------------------------------------------------------
CREATE POLICY "Service role can view all game_events"
  ON public.game_events FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view all game_stats"
  ON public.game_stats FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "Service role can view all player_stats"
  ON public.player_stats FOR SELECT
  USING (auth.role() = 'service_role');
