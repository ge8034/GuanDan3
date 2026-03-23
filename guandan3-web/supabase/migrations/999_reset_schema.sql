-- ============================================================================
-- GuanDan3 完整 Schema 重置脚本
-- 执行此脚本将删除所有表并重建，确保与代码完全对齐
-- ============================================================================

-- 1. 删除所有现有表（按依赖顺序）
DROP TABLE IF EXISTS public.achievement_stats CASCADE;
DROP TABLE IF EXISTS public.team_stats CASCADE;
DROP TABLE IF EXISTS public.time_stats CASCADE;
DROP TABLE IF EXISTS public.card_play_stats CASCADE;
DROP TABLE IF EXISTS public.player_stats CASCADE;
DROP TABLE IF EXISTS public.game_stats CASCADE;
DROP TABLE IF EXISTS public.game_events CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.scores CASCADE;
DROP TABLE IF EXISTS public.turns CASCADE;
DROP TABLE IF EXISTS public.game_hands CASCADE;
DROP TABLE IF EXISTS public.games CASCADE;
DROP TABLE IF EXISTS public.room_members CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 删除可能存在的重复表
DROP TABLE IF EXISTS public.game_rooms CASCADE;
DROP TABLE IF EXISTS public.room_players CASCADE;

-- 2. 重置权限
REVOKE ALL ON SCHEMA public FROM anon, authenticated, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ============================================================================
-- 3. 创建核心表
-- ============================================================================

-- 3.1 用户资料表
CREATE TABLE public.profiles (
  uid UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT NOT NULL DEFAULT '玩家',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.2 房间表
CREATE TABLE public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'pvp4' CHECK (mode IN ('pvp4', 'pve1v3')),
  status TEXT NOT NULL DEFAULT 'open',
  visibility TEXT NOT NULL DEFAULT 'public',
  name TEXT NOT NULL DEFAULT '新房间',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.3 房间成员表
CREATE TABLE public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  member_type TEXT NOT NULL DEFAULT 'human' CHECK (member_type IN ('human', 'ai')),
  uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_key TEXT,
  seat_no INT NOT NULL CHECK (seat_no BETWEEN 0 AND 3),
  ready BOOLEAN NOT NULL DEFAULT false,
  online BOOLEAN NOT NULL DEFAULT true,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(room_id, seat_no)
);

CREATE UNIQUE INDEX room_members_room_uid_uq
  ON public.room_members(room_id, uid) WHERE uid IS NOT NULL;

CREATE UNIQUE INDEX room_members_room_ai_key_uq
  ON public.room_members(room_id, ai_key) WHERE ai_key IS NOT NULL;

-- 3.4 游戏表
CREATE TABLE public.games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  seed BIGINT NOT NULL,
  status TEXT NOT NULL DEFAULT 'deal' CHECK (status IN ('deal', 'playing', 'paused', 'finished')),
  turn_no INT NOT NULL DEFAULT 0,
  current_seat INT NOT NULL DEFAULT 0 CHECK (current_seat BETWEEN 0 AND 3),
  state_public JSONB NOT NULL DEFAULT '{}'::JSONB,
  state_private JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.5 游戏手牌表 - 使用 uid 作为主键的一部分
CREATE TABLE public.game_hands (
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hand JSONB NOT NULL DEFAULT '[]'::JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (game_id, uid)
);

-- 3.6 出牌记录表
CREATE TABLE public.turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  turn_no INT NOT NULL,
  seat_no INT NOT NULL CHECK (seat_no BETWEEN 0 AND 3),
  action_id UUID NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX turns_game_turn_no_uq ON public.turns(game_id, turn_no);
CREATE UNIQUE INDEX turns_game_action_id_uq ON public.turns(game_id, action_id);

-- 3.7 积分表
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  uid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  total_after INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3.8 聊天消息表
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'system', 'emoji')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_room_id ON public.chat_messages(room_id, created_at DESC);

-- ============================================================================
-- 4. 统计分析表（与 src/types/game-stats.ts 完全对齐）
-- ============================================================================

-- 4.1 游戏事件表
CREATE TABLE public.game_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('card_played', 'trick_won', 'bomb_used', 'rocket_used', 'perfect_round', 'game_end')),
  timestamp BIGINT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_events_game_id ON public.game_events(game_id);
CREATE INDEX idx_game_events_user_id ON public.game_events(user_id);
CREATE INDEX idx_game_events_event_type ON public.game_events(event_type);

-- 4.2 游戏统计表
CREATE TABLE public.game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  game_type TEXT NOT NULL CHECK (game_type IN ('ranked', 'casual', 'practice')),
  result TEXT NOT NULL CHECK (result IN ('win', 'lose', 'draw')),
  team_score INT NOT NULL DEFAULT 0,
  opponent_score INT NOT NULL DEFAULT 0,
  duration BIGINT NOT NULL DEFAULT 0,
  cards_played INT NOT NULL DEFAULT 0,
  tricks_won INT NOT NULL DEFAULT 0,
  bombs_used INT NOT NULL DEFAULT 0,
  rockets_used INT NOT NULL DEFAULT 0,
  perfect_rounds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_game_stats_user_id ON public.game_stats(user_id);
CREATE INDEX idx_game_stats_created_at ON public.game_stats(created_at DESC);

-- 4.3 玩家累计统计表
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  total_games INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  draws INT NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_score INT NOT NULL DEFAULT 0,
  average_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_duration BIGINT NOT NULL DEFAULT 0,
  average_duration BIGINT NOT NULL DEFAULT 0,
  total_cards_played INT NOT NULL DEFAULT 0,
  total_tricks_won INT NOT NULL DEFAULT 0,
  total_bombs_used INT NOT NULL DEFAULT 0,
  total_rockets_used INT NOT NULL DEFAULT 0,
  perfect_games INT NOT NULL DEFAULT 0,
  longest_win_streak INT NOT NULL DEFAULT 0,
  current_win_streak INT NOT NULL DEFAULT 0,
  rank_points INT NOT NULL DEFAULT 1000,
  rank INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_player_stats_user_id ON public.player_stats(user_id);
CREATE INDEX idx_player_stats_rank_points ON public.player_stats(rank_points DESC);

-- 4.4 卡牌使用统计表
CREATE TABLE public.card_play_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  card_rank TEXT NOT NULL,
  card_suit TEXT NOT NULL,
  play_count INT NOT NULL DEFAULT 0,
  win_count INT NOT NULL DEFAULT 0,
  lose_count INT NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_position DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, card_rank, card_suit)
);

CREATE INDEX idx_card_play_stats_user_id ON public.card_play_stats(user_id);

-- 4.5 时间段统计表
CREATE TABLE public.time_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  hour INT NOT NULL CHECK (hour BETWEEN 0 AND 23),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  games_played INT NOT NULL DEFAULT 0,
  wins INT NOT NULL DEFAULT 0,
  losses INT NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  average_score DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_duration BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, hour, day_of_week)
);

CREATE INDEX idx_time_stats_user_id ON public.time_stats(user_id);

-- ============================================================================
-- 5. 启用 RLS
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_play_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_stats ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS 策略
-- ============================================================================

-- 6.1 profiles
CREATE POLICY "Profiles: Select own" ON public.profiles
  FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "Profiles: Insert own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "Profiles: Update own" ON public.profiles
  FOR UPDATE USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);

-- 6.2 rooms
CREATE POLICY "Rooms: Select public or member" ON public.rooms
  FOR SELECT USING (
    visibility = 'public'
    OR EXISTS (
      SELECT 1 FROM public.room_members m
      WHERE m.room_id = rooms.id AND m.uid = auth.uid()
    )
  );
CREATE POLICY "Rooms: Insert owner" ON public.rooms
  FOR INSERT WITH CHECK (auth.uid() = owner_uid);
CREATE POLICY "Rooms: Update owner" ON public.rooms
  FOR UPDATE USING (auth.uid() = owner_uid) WITH CHECK (auth.uid() = owner_uid);

-- 6.3 room_members
CREATE POLICY "Members: Select room members" ON public.room_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members m
      WHERE m.room_id = room_members.room_id AND m.uid = auth.uid()
    )
  );
CREATE POLICY "Members: Insert" ON public.room_members
  FOR INSERT WITH CHECK (auth.uid() = uid);
CREATE POLICY "Members: Update own" ON public.room_members
  FOR UPDATE USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);

-- 6.4 games
CREATE POLICY "Games: Select room members" ON public.games
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members m
      JOIN public.rooms r ON r.id = m.room_id
      WHERE r.id = games.room_id AND m.uid = auth.uid()
    )
  );

-- 6.5 game_hands
CREATE POLICY "Hands: Select own" ON public.game_hands
  FOR SELECT USING (auth.uid() = uid);
CREATE POLICY "Hands: Select service" ON public.game_hands
  FOR SELECT USING (auth.role() = 'service_role');

-- 6.6 turns
CREATE POLICY "Turns: Select room members" ON public.turns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members m
      JOIN public.rooms r ON r.id = m.room_id
      WHERE r.id = games.room_id AND m.uid = auth.uid()
    )
  );

-- 6.7 scores
CREATE POLICY "Scores: Select own" ON public.scores
  FOR SELECT USING (auth.uid() = uid);

-- 6.8 chat_messages
CREATE POLICY "Chat: Select room members" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.room_members m
      WHERE m.room_id = chat_messages.room_id AND m.uid = auth.uid()
    )
  );
CREATE POLICY "Chat: Insert members" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.room_members m
      WHERE m.room_id = chat_messages.room_id AND m.uid = auth.uid()
    )
  );

-- 6.9 统计表策略
CREATE POLICY "game_events: Users own" ON public.game_events
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "game_stats: Users own" ON public.game_stats
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "player_stats: Users own" ON public.player_stats
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "card_play_stats: Users own" ON public.card_play_stats
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "time_stats: Users own" ON public.time_stats
  FOR ALL USING (auth.uid()::text = user_id) WITH CHECK (auth.uid()::text = user_id);

-- ============================================================================
-- 7. 授权
-- ============================================================================
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- ============================================================================
-- 8. 启用 Realtime
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.games;
ALTER PUBLICATION supabase_realtime ADD TABLE public.turns;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
