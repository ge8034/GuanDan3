-- 修复版 start_game 函数
-- 使用兼容性更好的PostgreSQL语法

-- 删除所有旧版本的start_game函数
DROP FUNCTION IF EXISTS start_game(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS start_game(UUID) CASCADE;
DROP FUNCTION IF EXISTS start_game() CASCADE;

CREATE OR REPLACE FUNCTION start_game(
  p_room_id UUID
)
RETURNS TABLE(game_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_game_id UUID;
  v_seed BIGINT;
  v_current_seat INTEGER := 0;
  v_suits TEXT[];
  v_ranks TEXT[];
  v_deck TEXT[];
  v_deck_size INTEGER := 108; -- 两副牌 = 108张 (4花色*13点数*2 + 4张大小王)
  v_card_count INTEGER;
  v_player_id UUID;
  v_hand JSONB;
  v_state_private JSONB;
  v_state_public JSONB;
  v_i INTEGER;
  v_j INTEGER;
  v_temp TEXT;
  v_k INTEGER;
  v_s TEXT;
  v_r TEXT;
  v_cards_per_hand INTEGER := 27;
  v_started_by UUID;
BEGIN
  -- 获取当前用户ID (从auth.uid()或使用固定值用于匿名用户)
  v_started_by := auth.uid();
  IF v_started_by IS NULL THEN
    -- 对于练习模式，使用房间所有者ID
    SELECT owner_uid INTO v_started_by FROM rooms WHERE id = p_room_id;
  END IF;

  -- 1. 验证房间状态
  IF NOT EXISTS (
    SELECT 1 FROM rooms
    WHERE id = p_room_id
    AND status = 'open'
    AND owner_uid = v_started_by
  ) THEN
    RAISE EXCEPTION 'Room not found or not ready to start';
  END IF;

  -- 2. 检查是否已有运行中的游戏
  IF EXISTS (
    SELECT 1 FROM games
    WHERE room_id = p_room_id
    AND status IN ('playing', 'finished')
  ) THEN
    RAISE EXCEPTION 'Game already exists for this room';
  END IF;

  -- 3. 获取房间成员
  CREATE TEMPORARY TABLE temp_members AS
    SELECT uid, seat_no
    FROM room_members
    WHERE room_id = p_room_id
    AND member_type = 'human'
    ORDER BY seat_no;

  IF (SELECT COUNT(*) FROM temp_members) < 1 THEN
    DROP TABLE temp_members;
    RAISE EXCEPTION 'Need at least 1 player to start';
  END IF;

  -- 4. 生成随机种子 (使用BIGINT避免溢出)
  v_seed := (FLOOR(EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT) % 2147483647;

  -- 5. 初始化花色和点数数组
  v_suits := ARRAY['S', 'H', 'C', 'D'];
  v_ranks := ARRAY['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

  -- 6. 生成牌组 (两副牌，每副52张 = 104张 + 4张大小王 = 108张)
  v_deck := ARRAY[]::TEXT[];

  -- 第一副牌
  v_i := 1;
  WHILE v_i <= 4 LOOP
    v_s := v_suits[v_i];
    v_j := 1;
    WHILE v_j <= 13 LOOP
      v_r := v_ranks[v_j];
      v_deck := array_append(v_deck, v_s || '-' || v_r);
      v_j := v_j + 1;
    END LOOP;
    v_i := v_i + 1;
  END LOOP;

  -- 第二副牌
  v_i := 1;
  WHILE v_i <= 4 LOOP
    v_s := v_suits[v_i];
    v_j := 1;
    WHILE v_j <= 13 LOOP
      v_r := v_ranks[v_j];
      v_deck := array_append(v_deck, v_s || '-' || v_r);
      v_j := v_j + 1;
    END LOOP;
    v_i := v_i + 1;
  END LOOP;

  -- 添加4张大小王
  v_deck := array_append(v_deck, 'J-SJ'); -- 小王
  v_deck := array_append(v_deck, 'J-BJ'); -- 大王
  v_deck := array_append(v_deck, 'J-SJ'); -- 小王
  v_deck := array_append(v_deck, 'J-BJ'); -- 大王

  -- 7. 使用Fisher-Yates洗牌算法
  v_card_count := array_length(v_deck, 1);
  v_i := v_card_count;
  WHILE v_i > 1 LOOP
    -- 使用seed生成随机数 (使用BIGINT避免溢出)
    v_k := (((v_seed * v_i) % v_card_count) + 1)::INTEGER;
    -- LCG随机数生成器 (使用BIGINT避免溢出)
    v_seed := ((v_seed * 1103515245 + 12345) % 2147483647)::BIGINT;

    -- 交换
    v_temp := v_deck[v_i];
    v_deck[v_i] := v_deck[v_k];
    v_deck[v_k] := v_temp;

    v_i := v_i - 1;
  END LOOP;

  -- 8. 创建游戏记录
  v_state_public := '{"counts":[27,27,27,27],"rankings":[]}'::JSONB;

  INSERT INTO games (
    id,
    room_id,
    seed,
    status,
    turn_no,
    current_seat,
    state_public,
    state_private,
    created_at
  ) VALUES (
    gen_random_uuid(),
    p_room_id,
    v_seed,
    'playing',
    0,
    0,
    v_state_public,
    '{}'::JSONB,
    NOW()
  ) RETURNING id INTO v_game_id;

  -- 9. 发牌给每个玩家 (每人27张)
  -- Card格式: [{"id":0,"suit":"S","rank":"2","val":2},...]
  -- 使用text拼接构建JSONB数组，然后转换为JSONB
  v_state_private := '{}'::JSONB;

  -- 座位0: 索引 0-26
  v_hand := '[]'::JSONB;
  v_i := 0;
  WHILE v_i < 27 LOOP
    v_hand := v_hand || jsonb_build_object(
      'id', v_i,
      'suit', SUBSTRING(v_deck[v_i + 1] FROM 1 FOR 1),
      'rank', SUBSTRING(v_deck[v_i + 1] FROM 3),
      'val', CASE SUBSTRING(v_deck[v_i + 1] FROM 3)
        WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4
        WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7
        WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10
        WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13
        WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16
        ELSE 0
      END
    );
    v_i := v_i + 1;
  END LOOP;
  -- 使用jsonb_agg确保正确构建数组
  EXECUTE format($$
    SELECT $1::JSONB || (
      SELECT jsonb_agg(jsonb_build_object(
        'id', idx,
        'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1),
        'rank', SUBSTRING(v_deck[idx + 1] FROM 3),
        'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3)
          WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4
          WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7
          WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10
          WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13
          WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16
          ELSE 0
        END
      )) FROM generate_series(0, 26) AS idx
    )
  $$) INTO v_state_private USING v_state_private, v_deck;

  -- 为简化，直接使用jsonb_set设置整个hands结构
  -- 创建一个临时JSON字符串，然后解析
  v_state_private := (
    SELECT jsonb_build_object(
      'hands', jsonb_build_object(
        '0', (SELECT jsonb_agg(jsonb_build_object(
          'id', idx,
          'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1),
          'rank', CASE
            WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'SJ' THEN 'SJ'
            WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'BJ' THEN 'BJ'
            ELSE SUBSTRING(v_deck[idx + 1] FROM 3)
          END,
          'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3)
            WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4
            WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7
            WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10
            WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13
            WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16
            ELSE 0
          END
        )) FROM generate_series(0, 26) AS idx),
        '1', (SELECT jsonb_agg(jsonb_build_object(
          'id', idx,
          'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1),
          'rank', CASE
            WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'SJ' THEN 'SJ'
            WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'BJ' THEN 'BJ'
            ELSE SUBSTRING(v_deck[idx + 1] FROM 3)
          END,
          'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3)
            WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4
            WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7
            WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10
            WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13
            WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16
            ELSE 0
          END
        )) FROM generate_series(27, 53) AS idx),
        '2', (SELECT jsonb_agg(jsonb_build_object(
          'id', idx,
          'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1),
          'rank', CASE
            WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'SJ' THEN 'SJ'
            WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'BJ' THEN 'BJ'
            ELSE SUBSTRING(v_deck[idx + 1] FROM 3)
          END,
          'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3)
            WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4
            WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7
            WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10
            WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13
            WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16
            ELSE 0
          END
        )) FROM generate_series(54, 80) AS idx),
        '3', (SELECT jsonb_agg(jsonb_build_object(
          'id', idx,
          'suit', SUBSTRING(v_deck[idx + 1] FROM 1 FOR 1),
          'rank', CASE
            WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'SJ' THEN 'SJ'
            WHEN SUBSTRING(v_deck[idx + 1] FROM 3) = 'BJ' THEN 'BJ'
            ELSE SUBSTRING(v_deck[idx + 1] FROM 3)
          END,
          'val', CASE SUBSTRING(v_deck[idx + 1] FROM 3)
            WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4
            WHEN '5' THEN 5 WHEN '6' THEN 6 WHEN '7' THEN 7
            WHEN '8' THEN 8 WHEN '9' THEN 9 WHEN '10' THEN 10
            WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13
            WHEN 'A' THEN 14 WHEN 'SJ' THEN 15 WHEN 'BJ' THEN 16
            ELSE 0
          END
        )) FROM generate_series(81, 107) AS idx)
      )
    )
  );

  -- 10. 更新游戏的state_private
  UPDATE games
  SET state_private = v_state_private
  WHERE id = v_game_id;

  -- 11. 更新房间状态
  UPDATE rooms
  SET status = 'playing'
  WHERE id = p_room_id;

  -- 12. 清理临时表
  DROP TABLE temp_members;

  -- 返回游戏ID
  RETURN QUERY SELECT v_game_id;
END;
$$;

-- 授权执行
GRANT EXECUTE ON FUNCTION start_game(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_game(UUID) TO anon;

-- 添加注释
COMMENT ON FUNCTION start_game IS '开始一局新游戏，生成108张牌（两副牌+大小王），洗牌后发给4个玩家各27张牌';
