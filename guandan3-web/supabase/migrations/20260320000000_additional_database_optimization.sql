-- 额外的数据库性能优化
-- 补充遗漏的索引和优化

-- 优化房间邀请查询
CREATE INDEX IF NOT EXISTS idx_room_invitations_code_status 
ON room_invitations(invite_code, status) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_room_invitations_room_created 
ON room_invitations(room_id, created_at DESC);

-- 优化聊天房间查询
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user_created 
ON chat_rooms(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_rooms_updated 
ON chat_rooms(updated_at DESC);

-- 优化游戏回合历史查询
CREATE INDEX IF NOT EXISTS idx_game_turns_game_turn 
ON game_turns(game_id, turn_no DESC);

CREATE INDEX IF NOT EXISTS idx_game_turns_seat_turn 
ON game_turns(player_seat, turn_no DESC);

-- 优化游戏参与者查询
CREATE INDEX IF NOT EXISTS idx_game_participants_game_user 
ON game_participants(game_record_id, user_id);

CREATE INDEX IF NOT EXISTS idx_game_participants_user_game 
ON game_participants(user_id, game_record_id DESC);

-- 优化用户统计查询
CREATE INDEX IF NOT EXISTS idx_player_stats_user_level 
ON player_stats(user_id, current_level DESC);

CREATE INDEX IF NOT EXISTS idx_player_stats_rank_points 
ON player_stats(total_rank_points DESC);

-- 优化房间成员在线状态查询
CREATE INDEX IF NOT EXISTS idx_room_members_online_room 
ON room_members(online, room_id) 
WHERE online = true;

CREATE INDEX IF NOT EXISTS idx_room_members_ready_room 
ON room_members(ready, room_id) 
WHERE ready = true;

-- 优化游戏状态查询
CREATE INDEX IF NOT EXISTS idx_games_status_started 
ON games(status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_games_room_status_started 
ON games(room_id, status, started_at DESC);

-- 优化房间查询
CREATE INDEX IF NOT EXISTS idx_rooms_status_created 
ON rooms(status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rooms_visibility_status 
ON rooms(visibility, status) 
WHERE status = 'open';

-- 创建函数：优化获取房间在线成员
CREATE OR REPLACE FUNCTION get_room_online_members(p_room_id UUID)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  seat_no INTEGER,
  ready BOOLEAN,
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
    rm.member_type,
    u.avatar_url
  FROM room_members rm
  LEFT JOIN auth.users u ON rm.uid = u.id
  WHERE rm.room_id = p_room_id 
    AND rm.online = true
  ORDER BY rm.seat_no;
END;
$$ LANGUAGE plpgsql STABLE;

-- 创建函数：优化获取游戏历史记录
CREATE OR REPLACE FUNCTION get_game_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
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
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 添加注释
COMMENT ON FUNCTION get_room_online_members IS '获取房间在线成员，优化查询性能';
COMMENT ON FUNCTION get_game_history IS '获取游戏历史记录，优化查询性能';
