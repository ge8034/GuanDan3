-- 创建游戏事件表（用于统计和分析）
-- 记录游戏中的各种事件，如出牌、炸弹、火箭等

CREATE TABLE IF NOT EXISTS public.game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('card_played', 'trick_won', 'bomb_used', 'rocket_used', 'perfect_round', 'game_end')),
  timestamp BIGINT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX IF NOT EXISTS idx_game_events_user_id ON public.game_events(user_id);
CREATE INDEX IF NOT EXISTS idx_game_events_event_type ON public.game_events(event_type);
CREATE INDEX IF NOT EXISTS idx_game_events_timestamp ON public.game_events(timestamp);

-- 启用 RLS
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户只能读取自己的事件
CREATE POLICY "Users can view own game events"
  ON public.game_events FOR SELECT
  USING (auth.uid()::text = user_id);

-- RLS 策略：用户可以插入自己的事件
CREATE POLICY "Users can insert own game events"
  ON public.game_events FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- RLS 策略：服务端可以读取所有事件（用于统计）
CREATE POLICY "Service role can view all game events"
  ON public.game_events FOR SELECT
  USING (auth.role() = 'service_role');
