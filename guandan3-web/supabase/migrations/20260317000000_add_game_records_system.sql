-- 游戏记录表
CREATE TABLE IF NOT EXISTS game_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  game_type VARCHAR(20) NOT NULL DEFAULT 'standard', -- standard, ranked, custom
  game_mode VARCHAR(20) NOT NULL DEFAULT '2v2', -- 2v2, 3v1, 1v1
  status VARCHAR(20) NOT NULL DEFAULT 'completed', -- completed, abandoned, cancelled
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  
  -- 游戏结果
  winning_team VARCHAR(20) NOT NULL, -- team_a, team_b
  final_score JSONB NOT NULL DEFAULT '{"team_a": 0, "team_b": 0}',
  level_reached INTEGER NOT NULL DEFAULT 1,
  
  -- 游戏统计
  total_rounds INTEGER NOT NULL DEFAULT 0,
  total_cards_played INTEGER NOT NULL DEFAULT 0,
  total_bombs_played INTEGER NOT NULL DEFAULT 0,
  total_rocket_played INTEGER NOT NULL DEFAULT 0,
  
  -- 特殊事件
  special_events JSONB DEFAULT '[]', -- 记录特殊事件，如王炸、四带二等
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- 玩家战绩表
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 基础统计
  total_games INTEGER NOT NULL DEFAULT 0,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  win_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  
  -- 团队统计
  team_a_games INTEGER NOT NULL DEFAULT 0,
  team_a_wins INTEGER NOT NULL DEFAULT 0,
  team_b_games INTEGER NOT NULL DEFAULT 0,
  team_b_wins INTEGER NOT NULL DEFAULT 0,
  
  -- 游戏时长统计
  total_play_time_seconds BIGINT NOT NULL DEFAULT 0,
  avg_game_duration_seconds INTEGER NOT NULL DEFAULT 0,
  longest_game_duration_seconds INTEGER NOT NULL DEFAULT 0,
  shortest_game_duration_seconds INTEGER NOT NULL DEFAULT 0,
  
  -- 等级统计
  current_level INTEGER NOT NULL DEFAULT 1,
  highest_level INTEGER NOT NULL DEFAULT 1,
  total_level_ups INTEGER NOT NULL DEFAULT 0,
  total_level_downs INTEGER NOT NULL DEFAULT 0,
  
  -- 牌型统计
  total_bombs_played INTEGER NOT NULL DEFAULT 0,
  total_rockets_played INTEGER NOT NULL DEFAULT 0,
  total_straights_played INTEGER NOT NULL DEFAULT 0,
  total_aircraft_played INTEGER NOT NULL DEFAULT 0,
  
  -- 连胜连败统计
  current_win_streak INTEGER NOT NULL DEFAULT 0,
  longest_win_streak INTEGER NOT NULL DEFAULT 0,
  current_lose_streak INTEGER NOT NULL DEFAULT 0,
  longest_lose_streak INTEGER NOT NULL DEFAULT 0,
  
  -- 排名统计
  current_rank INTEGER NOT NULL DEFAULT 0,
  highest_rank INTEGER NOT NULL DEFAULT 0,
  total_rank_points INTEGER NOT NULL DEFAULT 0,
  
  -- 时间统计
  first_game_at TIMESTAMP WITH TIME ZONE,
  last_game_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 游戏参与者表（记录每局游戏的参与者）
CREATE TABLE IF NOT EXISTS game_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_record_id UUID NOT NULL REFERENCES game_records(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 玩家信息
  team VARCHAR(20) NOT NULL, -- team_a, team_b
  position INTEGER NOT NULL, -- 1, 2, 3, 4
  is_winner BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- 玩家表现
  cards_played INTEGER NOT NULL DEFAULT 0,
  bombs_played INTEGER NOT NULL DEFAULT 0,
  rockets_played INTEGER NOT NULL DEFAULT 0,
  straights_played INTEGER NOT NULL DEFAULT 0,
  aircraft_played INTEGER NOT NULL DEFAULT 0,
  
  -- 评分
  performance_score INTEGER NOT NULL DEFAULT 0, -- 0-100
  mvp BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- 变化
  level_change INTEGER NOT NULL DEFAULT 0,
  rank_points_change INTEGER NOT NULL DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(game_record_id, user_id)
);

-- 排行榜表
CREATE TABLE IF NOT EXISTS leaderboards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leaderboard_type VARCHAR(20) NOT NULL, -- overall, weekly, monthly, daily
  game_type VARCHAR(20) NOT NULL DEFAULT 'standard',
  
  -- 排行榜数据
  rankings JSONB NOT NULL DEFAULT '[]', -- 排名数据
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  UNIQUE(leaderboard_type, game_type)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_game_records_room_id ON game_records(room_id);
CREATE INDEX IF NOT EXISTS idx_game_records_user_id ON game_records(room_id);
CREATE INDEX IF NOT EXISTS idx_game_records_started_at ON game_records(started_at);
CREATE INDEX IF NOT EXISTS idx_game_records_status ON game_records(status);

CREATE INDEX IF NOT EXISTS idx_player_stats_user_id ON player_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_player_stats_current_rank ON player_stats(current_rank);
CREATE INDEX IF NOT EXISTS idx_player_stats_total_rank_points ON player_stats(total_rank_points DESC);

CREATE INDEX IF NOT EXISTS idx_game_participants_game_record_id ON game_participants(game_record_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_user_id ON game_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_game_participants_team ON game_participants(team);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type ON leaderboards(leaderboard_type);
CREATE INDEX IF NOT EXISTS idx_leaderboards_game_type ON leaderboards(game_type);

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_game_records_updated_at
  BEFORE UPDATE ON game_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leaderboards_updated_at
  BEFORE UPDATE ON leaderboards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 创建函数：计算玩家胜率
CREATE OR REPLACE FUNCTION calculate_win_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_games > 0 THEN
    NEW.win_rate = (NEW.total_wins::DECIMAL / NEW.total_games::DECIMAL) * 100;
  ELSE
    NEW.win_rate = 0.00;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_player_win_rate
  BEFORE INSERT OR UPDATE ON player_stats
  FOR EACH ROW
  EXECUTE FUNCTION calculate_win_rate();

-- 创建函数：更新玩家统计数据
CREATE OR REPLACE FUNCTION update_player_stats(
  p_user_id UUID,
  p_team VARCHAR,
  p_is_winner BOOLEAN,
  p_game_duration_seconds INTEGER,
  p_level_change INTEGER,
  p_rank_points_change INTEGER,
  p_cards_played INTEGER,
  p_bombs_played INTEGER,
  p_rockets_played INTEGER,
  p_straights_played INTEGER,
  p_aircraft_played INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO player_stats (
    user_id,
    total_games,
    total_wins,
    total_losses,
    team_a_games,
    team_a_wins,
    team_b_games,
    team_b_wins,
    total_play_time_seconds,
    current_level,
    highest_level,
    total_level_ups,
    total_level_downs,
    total_bombs_played,
    total_rockets_played,
    total_straights_played,
    total_aircraft_played,
    current_win_streak,
    longest_win_streak,
    current_lose_streak,
    longest_lose_streak,
    total_rank_points,
    first_game_at,
    last_game_at
  )
  VALUES (
    p_user_id,
    1,
    CASE WHEN p_is_winner THEN 1 ELSE 0 END,
    CASE WHEN NOT p_is_winner THEN 1 ELSE 0 END,
    CASE WHEN p_team = 'team_a' THEN 1 ELSE 0 END,
    CASE WHEN p_team = 'team_a' AND p_is_winner THEN 1 ELSE 0 END,
    CASE WHEN p_team = 'team_b' THEN 1 ELSE 0 END,
    CASE WHEN p_team = 'team_b' AND p_is_winner THEN 1 ELSE 0 END,
    p_game_duration_seconds,
    CASE WHEN p_level_change > 0 THEN p_level_change ELSE 1 END,
    CASE WHEN p_level_change > 0 THEN p_level_change ELSE 1 END,
    CASE WHEN p_level_change > 0 THEN 1 ELSE 0 END,
    CASE WHEN p_level_change < 0 THEN 1 ELSE 0 END,
    p_bombs_played,
    p_rockets_played,
    p_straights_played,
    p_aircraft_played,
    CASE WHEN p_is_winner THEN 1 ELSE 0 END,
    CASE WHEN p_is_winner THEN 1 ELSE 0 END,
    CASE WHEN NOT p_is_winner THEN 1 ELSE 0 END,
    CASE WHEN NOT p_is_winner THEN 1 ELSE 0 END,
    p_rank_points_change,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_games = player_stats.total_games + 1,
    total_wins = player_stats.total_wins + CASE WHEN p_is_winner THEN 1 ELSE 0 END,
    total_losses = player_stats.total_losses + CASE WHEN NOT p_is_winner THEN 1 ELSE 0 END,
    team_a_games = player_stats.team_a_games + CASE WHEN p_team = 'team_a' THEN 1 ELSE 0 END,
    team_a_wins = player_stats.team_a_wins + CASE WHEN p_team = 'team_a' AND p_is_winner THEN 1 ELSE 0 END,
    team_b_games = player_stats.team_b_games + CASE WHEN p_team = 'team_b' THEN 1 ELSE 0 END,
    team_b_wins = player_stats.team_b_wins + CASE WHEN p_team = 'team_b' AND p_is_winner THEN 1 ELSE 0 END,
    total_play_time_seconds = player_stats.total_play_time_seconds + p_game_duration_seconds,
    avg_game_duration_seconds = (player_stats.total_play_time_seconds + p_game_duration_seconds) / (player_stats.total_games + 1),
    longest_game_duration_seconds = GREATEST(player_stats.longest_game_duration_seconds, p_game_duration_seconds),
    shortest_game_duration_seconds = CASE 
      WHEN player_stats.shortest_game_duration_seconds = 0 THEN p_game_duration_seconds
      ELSE LEAST(player_stats.shortest_game_duration_seconds, p_game_duration_seconds)
    END,
    current_level = player_stats.current_level + p_level_change,
    highest_level = GREATEST(player_stats.highest_level, player_stats.current_level + p_level_change),
    total_level_ups = player_stats.total_level_ups + CASE WHEN p_level_change > 0 THEN 1 ELSE 0 END,
    total_level_downs = player_stats.total_level_downs + CASE WHEN p_level_change < 0 THEN 1 ELSE 0 END,
    total_bombs_played = player_stats.total_bombs_played + p_bombs_played,
    total_rockets_played = player_stats.total_rockets_played + p_rockets_played,
    total_straights_played = player_stats.total_straights_played + p_straights_played,
    total_aircraft_played = player_stats.total_aircraft_played + p_aircraft_played,
    current_win_streak = CASE 
      WHEN p_is_winner THEN player_stats.current_win_streak + 1
      ELSE 0
    END,
    longest_win_streak = GREATEST(
      player_stats.longest_win_streak,
      CASE WHEN p_is_winner THEN player_stats.current_win_streak + 1 ELSE 0 END
    ),
    current_lose_streak = CASE 
      WHEN NOT p_is_winner THEN player_stats.current_lose_streak + 1
      ELSE 0
    END,
    longest_lose_streak = GREATEST(
      player_stats.longest_lose_streak,
      CASE WHEN NOT p_is_winner THEN player_stats.current_lose_streak + 1 ELSE 0 END
    ),
    total_rank_points = player_stats.total_rank_points + p_rank_points_change,
    last_game_at = NOW(),
    first_game_at = COALESCE(player_stats.first_game_at, NOW());
END;
$$ LANGUAGE plpgsql;

-- 创建函数：更新排行榜
CREATE OR REPLACE FUNCTION update_leaderboard(
  p_leaderboard_type VARCHAR,
  p_game_type VARCHAR
)
RETURNS VOID AS $$
DECLARE
  v_rankings JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'user_id', ps.user_id,
      'rank', ROW_NUMBER() OVER (ORDER BY ps.total_rank_points DESC),
      'total_rank_points', ps.total_rank_points,
      'total_games', ps.total_games,
      'total_wins', ps.total_wins,
      'win_rate', ps.win_rate,
      'current_level', ps.current_level,
      'longest_win_streak', ps.longest_win_streak
    )
  ) INTO v_rankings
  FROM player_stats ps
  WHERE ps.total_games > 0
  ORDER BY ps.total_rank_points DESC
  LIMIT 100;

  INSERT INTO leaderboards (leaderboard_type, game_type, rankings)
  VALUES (p_leaderboard_type, p_game_type, v_rankings)
  ON CONFLICT (leaderboard_type, game_type) DO UPDATE SET
    rankings = v_rankings,
    last_updated = NOW();
END;
$$ LANGUAGE plpgsql;

-- 启用 RLS
ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view their own game records"
  ON game_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_participants
      WHERE game_participants.game_record_id = game_records.id
      AND game_participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own player stats"
  ON player_stats FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view game participants"
  ON game_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM game_records
      WHERE game_records.id = game_participants.game_record_id
      AND EXISTS (
        SELECT 1 FROM game_participants gp
        WHERE gp.game_record_id = game_records.id
        AND gp.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "All users can view leaderboards"
  ON leaderboards FOR SELECT
  USING (true);

-- 创建视图：玩家详细战绩
CREATE OR REPLACE VIEW player_detailed_stats AS
SELECT
  ps.user_id,
  ps.total_games,
  ps.total_wins,
  ps.total_losses,
  ps.win_rate,
  ps.team_a_games,
  ps.team_a_wins,
  ps.team_b_games,
  ps.team_b_wins,
  ps.total_play_time_seconds,
  ps.avg_game_duration_seconds,
  ps.longest_game_duration_seconds,
  ps.shortest_game_duration_seconds,
  ps.current_level,
  ps.highest_level,
  ps.total_level_ups,
  ps.total_level_downs,
  ps.total_bombs_played,
  ps.total_rockets_played,
  ps.total_straights_played,
  ps.total_aircraft_played,
  ps.current_win_streak,
  ps.longest_win_streak,
  ps.current_lose_streak,
  ps.longest_lose_streak,
  ps.current_rank,
  ps.highest_rank,
  ps.total_rank_points,
  ps.first_game_at,
  ps.last_game_at,
  -- 计算平均每局炸弹数
  CASE WHEN ps.total_games > 0 THEN ROUND((ps.total_bombs_played::DECIMAL / ps.total_games::DECIMAL)::NUMERIC, 2) ELSE 0 END AS avg_bombs_per_game,
  -- 计算平均每局火箭数
  CASE WHEN ps.total_games > 0 THEN ROUND((ps.total_rockets_played::DECIMAL / ps.total_games::DECIMAL)::NUMERIC, 2) ELSE 0 END AS avg_rockets_per_game,
  -- 计算平均每局顺子数
  CASE WHEN ps.total_games > 0 THEN ROUND((ps.total_straights_played::DECIMAL / ps.total_games::DECIMAL)::NUMERIC, 2) ELSE 0 END AS avg_straights_per_game,
  -- 计算平均每局飞机数
  CASE WHEN ps.total_games > 0 THEN ROUND((ps.total_aircraft_played::DECIMAL / ps.total_games::DECIMAL)::NUMERIC, 2) ELSE 0 END AS avg_aircraft_per_game
FROM player_stats ps;

-- 创建视图：最近游戏记录
CREATE OR REPLACE VIEW recent_game_records AS
SELECT
  gr.id,
  gr.room_id,
  gr.game_type,
  gr.game_mode,
  gr.status,
  gr.started_at,
  gr.ended_at,
  gr.duration_seconds,
  gr.winning_team,
  gr.final_score,
  gr.level_reached,
  gr.total_rounds,
  gr.total_cards_played,
  gr.total_bombs_played,
  gr.total_rocket_played,
  gr.special_events,
  -- 获取当前用户的信息
  (
    SELECT jsonb_build_object(
      'team', gp.team,
      'position', gp.position,
      'is_winner', gp.is_winner,
      'cards_played', gp.cards_played,
      'bombs_played', gp.bombs_played,
      'rockets_played', gp.rockets_played,
      'performance_score', gp.performance_score,
      'mvp', gp.mvp,
      'level_change', gp.level_change,
      'rank_points_change', gp.rank_points_change
    )
    FROM game_participants gp
    WHERE gp.game_record_id = gr.id
    AND gp.user_id = auth.uid()
    LIMIT 1
  ) AS player_info
FROM game_records gr
WHERE EXISTS (
  SELECT 1 FROM game_participants gp
  WHERE gp.game_record_id = gr.id
  AND gp.user_id = auth.uid()
)
ORDER BY gr.started_at DESC
LIMIT 50;
