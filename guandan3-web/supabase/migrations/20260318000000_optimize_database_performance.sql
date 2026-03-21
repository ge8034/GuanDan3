-- 数据库性能优化迁移
-- 添加复合索引、部分索引和查询优化函数

-- 优化房间查询的复合索引
CREATE INDEX IF NOT EXISTS idx_rooms_status_visibility 
ON rooms(status, visibility) 
WHERE status != 'closed';

CREATE INDEX IF NOT EXISTS idx_rooms_owner_status 
ON rooms(owner_uid, status) 
WHERE status = 'open';

-- 优化房间成员查询的复合索引
CREATE INDEX IF NOT EXISTS idx_room_members_room_seat 
ON room_members(room_id, seat_no) 
WHERE member_type = 'human';

CREATE INDEX IF NOT EXISTS idx_room_members_room_ready 
ON room_members(room_id, ready) 
WHERE member_type = 'human';

-- 优化游戏查询的复合索引
CREATE INDEX IF NOT EXISTS idx_games_room_status 
ON games(room_id, status);

CREATE INDEX IF NOT EXISTS idx_games_current_turn 
ON games(room_id, current_turn) 
WHERE status = 'playing';

-- 优化游戏回合查询的复合索引
CREATE INDEX IF NOT EXISTS idx_game_turns_room_turn 
ON game_turns(room_id, turn_no);

CREATE INDEX IF NOT EXISTS idx_game_turns_room_player 
ON game_turns(room_id, player_seat) 
WHERE turn_no > 0;

-- 优化游戏记录查询的复合索引
CREATE INDEX IF NOT EXISTS idx_game_records_room_started 
ON game_records(room_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_game_records_user_started 
ON game_records(room_id, started_at DESC) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_game_records_type_started 
ON game_records(game_type, started_at DESC);

-- 优化玩家统计查询的复合索引
CREATE INDEX IF NOT EXISTS idx_player_stats_user_updated 
ON player_stats(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_player_stats_rank_points 
ON player_stats(total_rank_points DESC, current_rank ASC);

-- 优化游戏参与者查询的复合索引
CREATE INDEX IF NOT EXISTS idx_game_participants_user_game 
ON game_participants(user_id, game_record_id DESC);

CREATE INDEX IF NOT EXISTS idx_game_participants_game_team 
ON game_participants(game_record_id, team, position);

-- 优化好友关系查询的复合索引
CREATE INDEX IF NOT EXISTS idx_friendships_user_status 
ON friendships(user_id, status) 
WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_friendships_friend_status 
ON friendships(friend_id, status) 
WHERE status = 'accepted';

CREATE INDEX IF NOT EXISTS idx_friendships_user_created 
ON friendships(user_id, created_at DESC);

-- 优化聊天消息查询的复合索引
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_created 
ON chat_messages(room_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_created 
ON chat_messages(sender_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room_unread 
ON chat_messages(room_id, created_at) 
WHERE is_read = false;

-- 优化排行榜查询的复合索引
CREATE INDEX IF NOT EXISTS idx_leaderboards_type_updated 
ON leaderboards(leaderboard_type, game_type, last_updated DESC);

-- 创建部分索引以减少索引大小
CREATE INDEX IF NOT EXISTS idx_active_rooms 
ON rooms(created_at DESC) 
WHERE status = 'open';

CREATE INDEX IF NOT EXISTS idx_playing_games 
ON games(started_at DESC) 
WHERE status = 'playing';

CREATE INDEX IF NOT EXISTS idx_online_members 
ON room_members(room_id, seat_no) 
WHERE online = true;

CREATE INDEX IF NOT EXISTS idx_ready_members 
ON room_members(room_id, seat_no) 
WHERE ready = true;

-- 创建函数：优化获取活跃房间列表
CREATE OR REPLACE FUNCTION get_active_rooms(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  name TEXT,
  mode VARCHAR(20),
  type VARCHAR(20),
  status VARCHAR(20),
  visibility VARCHAR(20),
  member_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.name,
    r.mode,
    r.type,
    r.status,
    r.visibility,
    COUNT(rm.id) as member_count,
    r.created_at
  FROM rooms r
  LEFT JOIN room_members rm ON r.id = rm.room_id
  WHERE r.status = 'open'
  GROUP BY r.id
  ORDER BY r.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 创建函数：优化获取用户游戏统计
CREATE OR REPLACE FUNCTION get_user_game_stats(p_user_id UUID)
RETURNS TABLE (
  total_games BIGINT,
  total_wins BIGINT,
  total_losses BIGINT,
  win_rate DECIMAL(5,2),
  current_level INTEGER,
  current_rank INTEGER,
  total_rank_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ps.total_games, 0) as total_games,
    COALESCE(ps.total_wins, 0) as total_wins,
    COALESCE(ps.total_losses, 0) as total_losses,
    COALESCE(ps.win_rate, 0.00) as win_rate,
    COALESCE(ps.current_level, 1) as current_level,
    COALESCE(ps.current_rank, 0) as current_rank,
    COALESCE(ps.total_rank_points, 0) as total_rank_points
  FROM player_stats ps
  WHERE ps.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- 创建函数：优化获取排行榜数据
CREATE OR REPLACE FUNCTION get_leaderboard_data(
  p_leaderboard_type VARCHAR,
  p_game_type VARCHAR DEFAULT 'standard',
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  rank INTEGER,
  user_id UUID,
  username TEXT,
  total_rank_points INTEGER,
  total_wins INTEGER,
  win_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROW_NUMBER() OVER (ORDER BY ps.total_rank_points DESC) as rank,
    ps.user_id,
    u.username,
    ps.total_rank_points,
    ps.total_wins,
    ps.win_rate
  FROM player_stats ps
  JOIN auth.users u ON ps.user_id = u.id
  WHERE ps.total_games > 0
  ORDER BY ps.total_rank_points DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 创建函数：优化获取用户最近游戏记录
CREATE OR REPLACE FUNCTION get_user_recent_games(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  game_id UUID,
  game_type VARCHAR,
  game_mode VARCHAR,
  status VARCHAR,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  winning_team VARCHAR,
  is_winner BOOLEAN,
  level_change INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gr.id as game_id,
    gr.game_type,
    gr.game_mode,
    gr.status,
    gr.started_at,
    gr.ended_at,
    gr.winning_team,
    gp.is_winner,
    gp.level_change
  FROM game_records gr
  JOIN game_participants gp ON gr.id = gp.game_record_id
  WHERE gp.user_id = p_user_id
  ORDER BY gr.started_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- 创建函数：优化获取房间成员信息
CREATE OR REPLACE FUNCTION get_room_members_info(p_room_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  seat_no INTEGER,
  ready BOOLEAN,
  online BOOLEAN,
  member_type VARCHAR,
  avatar_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rm.uid as user_id,
    COALESCE(u.username, 'AI') as username,
    rm.seat_no,
    rm.ready,
    rm.online,
    rm.member_type,
    u.avatar_url
  FROM room_members rm
  LEFT JOIN auth.users u ON rm.uid = u.id
  WHERE rm.room_id = p_room_id
  ORDER BY rm.seat_no;
END;
$$ LANGUAGE plpgsql STABLE;

-- 创建触发器：自动更新 player_stats 的 updated_at
CREATE OR REPLACE FUNCTION update_player_stats_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_player_stats_timestamp
BEFORE UPDATE ON player_stats
FOR EACH ROW
EXECUTE FUNCTION update_player_stats_timestamp();

-- 创建触发器：自动更新 leaderboards 的 updated_at
CREATE OR REPLACE FUNCTION update_leaderboards_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_leaderboards_timestamp
BEFORE UPDATE ON leaderboards
FOR EACH ROW
EXECUTE FUNCTION update_leaderboards_timestamp();

-- 创建视图：优化房间列表查询
CREATE OR REPLACE VIEW active_rooms_view AS
SELECT 
  r.id,
  r.name,
  r.mode,
  r.type,
  r.status,
  r.visibility,
  r.owner_uid,
  r.created_at,
  COUNT(rm.id) as member_count,
  COUNT(CASE WHEN rm.ready THEN 1 END) as ready_count
FROM rooms r
LEFT JOIN room_members rm ON r.id = rm.room_id
WHERE r.status = 'open'
GROUP BY r.id
ORDER BY r.created_at DESC;

-- 创建视图：优化用户游戏统计查询
CREATE OR REPLACE VIEW user_game_stats_view AS
SELECT 
  ps.user_id,
  u.username,
  ps.total_games,
  ps.total_wins,
  ps.total_losses,
  ps.win_rate,
  ps.current_level,
  ps.current_rank,
  ps.total_rank_points,
  ps.current_win_streak,
  ps.longest_win_streak,
  ps.total_play_time_seconds,
  ps.avg_game_duration_seconds
FROM player_stats ps
JOIN auth.users u ON ps.user_id = u.id
WHERE ps.total_games > 0;

-- 添加注释
COMMENT ON FUNCTION get_active_rooms IS '获取活跃房间列表，优化查询性能';
COMMENT ON FUNCTION get_user_game_stats IS '获取用户游戏统计，优化查询性能';
COMMENT ON FUNCTION get_leaderboard_data IS '获取排行榜数据，优化查询性能';
COMMENT ON FUNCTION get_user_recent_games IS '获取用户最近游戏记录，优化查询性能';
COMMENT ON FUNCTION get_room_members_info IS '获取房间成员信息，优化查询性能';
COMMENT ON VIEW active_rooms_view IS '活跃房间视图，优化房间列表查询';
COMMENT ON VIEW user_game_stats_view IS '用户游戏统计视图，优化统计查询';
