-- 数据库查询优化 - 修复 N+1 查询
-- 优化 fetchRoom 函数使用单个嵌套查询

-- 1. 优化的 fetchRoom RPC - 返回与原查询兼容的数据结构
CREATE OR REPLACE FUNCTION get_room_with_members_optimized(p_room_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_room RECORD;
  v_members JSONB;
  v_result JSONB;
BEGIN
  -- 获取房间信息
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id;

  IF NOT FOUND THEN
    RETURN NULL::JSONB;
  END IF;

  -- 获取成员信息（与原查询结构一致）
  SELECT COALESCE(JSONB_AGG(JSONB_BUILD_OBJECT(
    'id', id,
    'room_id', room_id,
    'uid', uid,
    'seat_no', seat_no,
    'ready', ready,
    'online', online,
    'member_type', member_type,
    'ai_key', ai_key
    -- 注意：不包含 difficulty，保持与原查询一致
  )), '[]'::JSONB) INTO v_members
  FROM (
    SELECT id, room_id, uid, seat_no, ready, online, member_type, ai_key
    FROM room_members
    WHERE room_id = p_room_id
    ORDER BY seat_no
  ) sub;

  -- 构建返回结果（包含房间和成员）
  v_result := JSONB_BUILD_OBJECT(
    'id', v_room.id,
    'name', v_room.name,
    'mode', v_room.mode,
    'type', v_room.type,
    'status', v_room.status,
    'visibility', v_room.visibility,
    'owner_uid', v_room.owner_uid,
    'created_at', v_room.created_at,
    'room_members', v_members
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. 优化成员查询索引（添加覆盖索引）
CREATE INDEX IF NOT EXISTS idx_room_members_room_seat_online
ON room_members(room_id, seat_no, online, ready, member_type);

-- 3. 优化房间查询索引
CREATE INDEX IF NOT EXISTS idx_rooms_id_status
ON rooms(id, status)
WHERE status = 'open';

-- 4. 优化 heartbeat 查询（使用索引）
CREATE INDEX IF NOT EXISTS idx_room_members_uid_online_last_seen
ON room_members(uid, online, last_seen_at DESC)
WHERE online = true;

-- 5. 创建函数：优化房间成员查询（用于 Realtime 更新后）
CREATE OR REPLACE FUNCTION get_room_members_simple(p_room_id UUID)
RETURNS TABLE (
  id TEXT,
  room_id UUID,
  uid UUID,
  seat_no INTEGER,
  ready BOOLEAN,
  online BOOLEAN,
  member_type TEXT,
  ai_key TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rm.id::TEXT,
    rm.room_id,
    rm.uid,
    rm.seat_no,
    rm.ready,
    rm.online,
    rm.member_type::TEXT,
    rm.ai_key
  FROM room_members rm
  WHERE rm.room_id = p_room_id
  ORDER BY rm.seat_no;
END;
$$ LANGUAGE plpgsql STABLE;

-- 6. 添加查询性能监控
CREATE OR REPLACE FUNCTION check_missing_indexes()
RETURNS TABLE (
  table_name TEXT,
  column_name TEXT,
  suggested_index TEXT
) AS $$
BEGIN
  -- 返回可能需要添加的索引建议
  RETURN QUERY
  SELECT
    'room_members'::TEXT as table_name,
    'room_id, seat_no, online'::TEXT as column_name,
    'CREATE INDEX idx_room_members_room_seat_online ON room_members(room_id, seat_no, online)'::TEXT as suggested_index
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'room_members'
    AND indexdef LIKE '%room_id%seat_no%online%'
  )
  UNION ALL
  SELECT
    'rooms'::TEXT as table_name,
    'id, status'::TEXT as column_name,
    'CREATE INDEX idx_rooms_id_status ON rooms(id, status) WHERE status = ''open'''::TEXT as suggested_index
  WHERE NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'rooms'
    AND indexdef LIKE '%id%status%'
  );
END;
$$ LANGUAGE plpgsql;

-- 7. 添加注释
COMMENT ON FUNCTION get_room_with_members_optimized IS '优化获取房间信息，一次性返回房间和成员数据，减少查询次数。返回 JSONB 格式，兼容原有数据结构。';
COMMENT ON FUNCTION get_room_members_simple IS '快速获取房间成员列表，用于 Realtime 更新后的刷新。';
COMMENT ON FUNCTION check_missing_indexes IS '检查可能缺失的数据库索引，返回建议的索引创建语句。';

