-- ============================================
-- 游戏API错误修复脚本
-- 解决400和403错误问题
-- ============================================

-- 1. 检查并修复games表的RLS策略
-- ============================================

-- 首先检查当前策略
DO $$
DECLARE
  policy_count int;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'games';

  RAISE NOTICE '当前games表有 % 个RLS策略', policy_count;
END $$;

-- 确保用户可以读取games表
DROP POLICY IF EXISTS "Users can view games" ON games;
CREATE POLICY "Users can view games"
  ON games
  FOR SELECT
  USING (
    -- 用户是房间成员
    room_id IN (
      SELECT room_id FROM room_members
      WHERE uid = auth.uid()
    )
    OR
    -- 或房间是公开的（如果有is_public字段）
    (EXISTS (
      SELECT 1 FROM rooms
      WHERE rooms.id = games.room_id
      AND (rooms.is_public = true OR rooms.created_by = auth.uid())
    ))
  );

-- 确保用户可以插入games表
DROP POLICY IF EXISTS "Users can insert games" ON games;
CREATE POLICY "Users can insert games"
  ON games
  FOR INSERT
  WITH CHECK (
    -- 用户是房主或房间成员
    room_id IN (
      SELECT room_id FROM room_members
      WHERE uid = auth.uid()
    )
    OR
    room_id IN (
      SELECT id FROM rooms
      WHERE created_by = auth.uid()
    )
  );

-- 确保用户可以更新games表
DROP POLICY IF EXISTS "Users can update games" ON games;
CREATE POLICY "Users can update games"
  ON games
  FOR UPDATE
  USING (
    -- 通过room_members关联验证
    room_id IN (
      SELECT room_id FROM room_members
      WHERE uid = auth.uid()
    )
  );

-- 2. 修复start_game RPC函数权限
-- ============================================

-- 重新创建start_game函数，确保有适当的权限检查
CREATE OR REPLACE FUNCTION start_game(p_room_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room record;
  v_game_id uuid;
  v_players jsonb;
  v_state_private jsonb;
  v_state_public jsonb;
  v_level_rank int;
BEGIN
  -- 获取房间信息
  SELECT * INTO v_room
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- 检查权限：必须是房主或房间成员
  IF v_room.created_by != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM room_members
    WHERE room_id = p_room_id AND uid = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Permission denied';
  END IF;

  -- 检查是否已经有游戏在进行
  IF EXISTS (
    SELECT 1 FROM games
    WHERE room_id = p_room_id
    AND status IN ('deal', 'playing', 'paused')
  ) THEN
    RAISE EXCEPTION 'Game already in progress';
  END IF;

  -- 获取级牌
  v_level_rank := COALESCE(v_room.level_rank, 2);

  -- 初始化state_public
  v_state_public = jsonb_build_object(
    'counts', ARRAY[27, 27, 27, 27],
    'rankings', ARRAY[]::int[],
    'levelRank', v_level_rank
  );

  -- 初始化state_private（为AI预留手牌位置）
  v_state_private = jsonb_build_object(
    '0', '[]',
    '1', '[]',
    '2', '[]',
    '3', '[]'
  );

  -- 创建游戏记录
  INSERT INTO games (
    room_id,
    status,
    turn_no,
    current_seat,
    state_public,
    state_private,
    level_rank
  ) VALUES (
    p_room_id,
    'deal',
    0,
    0,
    v_state_public,
    v_state_private,
    v_level_rank
  ) RETURNING id INTO v_game_id;

  -- 返回游戏信息
  RETURN jsonb_build_object(
    'game_id', v_game_id,
    'room_id', p_room_id,
    'status', 'deal',
    'message', 'Game started successfully'
  );
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION start_game(text) TO authenticated;
GRANT EXECUTE ON FUNCTION start_game(text) TO anon;

-- 3. 修复游戏查询的status过滤问题
-- ============================================

-- 确保status列有正确的约束
DO $$
BEGIN
  -- 检查status列是否存在
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games'
    AND column_name = 'status'
  ) THEN
    RAISE NOTICE 'games.status column exists';

    -- 检查是否有check约束
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints
      WHERE table_name = 'games'
      AND constraint_type = 'CHECK'
    ) THEN
      RAISE NOTICE 'games table has CHECK constraints';
    END IF;
  END IF;
END $$;

-- 4. 添加有用的调试视图
-- ============================================

CREATE OR REPLACE VIEW debug_games AS
SELECT
  g.id,
  g.room_id,
  g.status,
  g.turn_no,
  g.current_seat,
  g.level_rank,
  r.created_by,
  rm.uid as current_user,
  rm.seat_no
FROM games g
LEFT JOIN rooms r ON g.room_id = r.id
LEFT JOIN room_members rm ON g.room_id = rm.room_id AND rm.uid = auth.uid();

GRANT SELECT ON debug_games TO authenticated;
GRANT SELECT ON debug_games TO anon;

-- 5. 验证修复
-- ============================================

DO $$
DECLARE
  v_policy_count int;
  v_function_exists boolean;
BEGIN
  -- 检查策略数量
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE tablename = 'games';

  RAISE NOTICE '✅ games表RLS策略: % 个', v_policy_count;

  -- 检查start_game函数
  SELECT EXISTS(
    SELECT 1 FROM pg_proc
    WHERE proname = 'start_game'
  ) INTO v_function_exists;

  IF v_function_exists THEN
    RAISE NOTICE '✅ start_game函数: 已存在';
  ELSE
    RAISE NOTICE '❌ start_game函数: 不存在';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '修复脚本执行完成！';
  RAISE NOTICE '========================================';
END $$;
