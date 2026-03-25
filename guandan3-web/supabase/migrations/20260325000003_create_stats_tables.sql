-- 创建玩家统计表
CREATE TABLE IF NOT EXISTS public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  total_games INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  draws INT DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  total_score INT DEFAULT 0,
  average_score DECIMAL(10,2) DEFAULT 0,
  total_duration BIGINT DEFAULT 0,
  average_duration BIGINT DEFAULT 0,
  total_cards_played INT DEFAULT 0,
  total_tricks_won INT DEFAULT 0,
  total_bombs_used INT DEFAULT 0,
  total_rockets_used INT DEFAULT 0,
  perfect_games INT DEFAULT 0,
  longest_win_streak INT DEFAULT 0,
  current_win_streak INT DEFAULT 0,
  rank_points INT DEFAULT 1000,
  rank INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建卡牌使用统计表
CREATE TABLE IF NOT EXISTS public.card_play_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  card_rank TEXT NOT NULL,
  card_suit TEXT NOT NULL,
  play_count INT DEFAULT 0,
  win_count INT DEFAULT 0,
  lose_count INT DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  average_position DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_rank, card_suit)
);

-- 创建时间统计表
CREATE TABLE IF NOT EXISTS public.time_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  day_of_week INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  games_played INT DEFAULT 0,
  wins INT DEFAULT 0,
  losses INT DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  average_score DECIMAL(10,2) DEFAULT 0,
  total_duration BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hour, day_of_week)
);

-- 创建游戏事件表
CREATE TABLE IF NOT EXISTS public.game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON public.player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_card_play_stats_user_id ON public.card_play_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_time_stats_user_id ON public.time_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_user_id ON public.game_events(user_id);

-- 启用 RLS
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_play_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- RLS 策略：使用 auth.uid()::text 进行类型转换
DROP POLICY IF EXISTS "Users can view own player_stats" ON public.player_stats;
CREATE POLICY "Users can view own player_stats" ON public.player_stats
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own player_stats" ON public.player_stats;
CREATE POLICY "Users can insert own player_stats" ON public.player_stats
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own player_stats" ON public.player_stats;
CREATE POLICY "Users can update own player_stats" ON public.player_stats
  FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own card_play_stats" ON public.card_play_stats;
CREATE POLICY "Users can view own card_play_stats" ON public.card_play_stats
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own card_play_stats" ON public.card_play_stats;
CREATE POLICY "Users can insert own card_play_stats" ON public.card_play_stats
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own card_play_stats" ON public.card_play_stats;
CREATE POLICY "Users can update own card_play_stats" ON public.card_play_stats
  FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own time_stats" ON public.time_stats;
CREATE POLICY "Users can view own time_stats" ON public.time_stats
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own time_stats" ON public.time_stats;
CREATE POLICY "Users can insert own time_stats" ON public.time_stats
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own time_stats" ON public.time_stats;
CREATE POLICY "Users can update own time_stats" ON public.time_stats
  FOR UPDATE USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can view own game_events" ON public.game_events;
CREATE POLICY "Users can view own game_events" ON public.game_events
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can insert own game_events" ON public.game_events;
CREATE POLICY "Users can insert own game_events" ON public.game_events
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
