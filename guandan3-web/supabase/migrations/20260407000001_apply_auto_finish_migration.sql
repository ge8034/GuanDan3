-- 应用auto_finish_old_game迁移的包装函数
-- 这个函数会替换start_game函数

-- 删除并重新创建start_game函数（包含auto_finish逻辑）
DROP FUNCTION IF EXISTS public.start_game(uuid);

CREATE OR REPLACE FUNCTION public.start_game(
  p_room_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_game_id uuid;
  v_room_status text;
  v_room_mode text;
  v_room_type text;
  v_owner_uid uuid;
  v_member_count int;
  v_ready_count int;
  v_is_rematch boolean;
  v_finished_count int;
  v_level_rank int;
  v_existing_game_id uuid;
  v_deck jsonb[] := array[]::jsonb[];
  v_shuffled_deck jsonb[];
  v_hands jsonb[] := array['[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb];
  v_state_private_hands jsonb;
  v_card jsonb;
  v_i int;
  v_suit text;
  v_rank text;
  v_val int;
  v_suits text[] := array['H', 'D', 'C', 'S'];
  v_ranks text[] := array['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
BEGIN
  -- 获取房间信息
  SELECT status, mode, type, owner_uid
    INTO v_room_status, v_room_mode, v_room_type, v_owner_uid
    FROM public.rooms
    WHERE id = p_room_id
    FOR UPDATE;

  -- 验证房间存在
  IF v_room_status IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  -- 验证权限
  IF v_owner_uid <> auth.uid() THEN
    RAISE EXCEPTION 'Only the room owner can start a game';
  END IF;

  -- **核心修复**: 如果有进行中的游戏，自动完成它
  IF v_room_status = 'playing' THEN
    SELECT id INTO v_existing_game_id
    FROM public.games
    WHERE room_id = p_room_id AND status = 'playing'
    LIMIT 1;
    
    IF v_existing_game_id IS NOT NULL THEN
      -- 自动完成旧游戏
      UPDATE public.games 
      SET status = 'finished', 
          finished_at = NOW(),
          updated_at = NOW()
      WHERE id = v_existing_game_id;
      
      -- 将房间状态设为open
      UPDATE public.rooms SET status = 'open' WHERE id = p_room_id;
      v_room_status := 'open';
      
      -- 记录日志
      RAISE NOTICE 'Auto-finished existing game % for room %', v_existing_game_id, p_room_id;
    END IF;
  END IF;

  -- 验证房间状态
  IF v_room_status <> 'open' THEN
    RAISE EXCEPTION 'Room is not ready (Status: %)', v_room_status;
  END IF;

  -- 检查是否是重赛
  v_is_rematch := EXISTS (
    SELECT 1 FROM public.games
    WHERE room_id = p_room_id AND status = 'finished'
  );

  -- PVP模式需要4人且都准备
  IF v_room_mode = 'pvp4' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE ready = true)
      INTO v_member_count, v_ready_count
      FROM public.room_members
      WHERE room_id = p_room_id;

    IF v_member_count < 4 THEN
      RAISE EXCEPTION 'Not enough members (have %)', v_member_count;
    END IF;

    IF v_ready_count < 4 THEN
      RAISE EXCEPTION 'Not all members are ready (%/4)', v_ready_count;
    END IF;
  END IF;

  -- 获取级牌
  SELECT level_rank INTO v_level_rank
  FROM public.rooms
  WHERE id = p_room_id;

  IF v_level_rank IS NULL THEN
    v_level_rank := 2;
  END IF;

  -- 创建新游戏
  INSERT INTO public.games (room_id, status, level_rank)
  VALUES (p_room_id, 'playing', v_level_rank)
  RETURNING id INTO v_game_id;

  -- 更新房间状态
  UPDATE public.rooms
  SET status = 'playing',
      current_game_id = v_game_id,
      updated_at = NOW()
  WHERE id = p_room_id;

  -- 生成并洗牌
  FOR v_i IN 1..108 LOOP
    v_suit := v_suits[mod(v_i - 1, 4) + 1];
    v_rank := v_ranks[mod(ceil(v_i::numeric / 4)::int - 1, 13) + 1];
    
    IF v_i = 105 THEN
      v_val := 100; v_suit := 'J'; v_rank := 'bk';
    ELSIF v_i = 106 THEN
      v_val := 100; v_suit := 'J'; v_rank := 'bk';
    ELSIF v_i = 107 THEN
      v_val := 200; v_suit := 'J'; v_rank := 'hr';
    ELSIF v_i = 108 THEN
      v_val := 200; v_suit := 'J'; v_rank := 'hr';
    ELSE
      v_val := CASE v_rank
        WHEN '2' THEN 2 WHEN '3' THEN 3 WHEN '4' THEN 4 WHEN '5' THEN 5
        WHEN '6' THEN 6 WHEN '7' THEN 7 WHEN '8' THEN 8 WHEN '9' THEN 9
        WHEN '10' THEN 10 WHEN 'J' THEN 11 WHEN 'Q' THEN 12 WHEN 'K' THEN 13
        WHEN 'A' THEN 14 ELSE 2
      END;
    END IF;

    v_card := jsonb_build_object('id', v_i, 'suit', v_suit, 'rank', v_rank, 'val', v_val);
    v_deck := array_append(v_deck, v_card);
  END LOOP;

  -- 固定洗牌顺序
  v_shuffled_deck := array[
    v_deck[27], v_deck[0], v_deck[4], v_deck[25], v_deck[53], v_deck[75], v_deck[14], v_deck[45],
    v_deck[73], v_deck[67], v_deck[20], v_deck[95], v_deck[58], v_deck[31], v_deck[9], v_deck[84],
    v_deck[77], v_deck[50], v_deck[37], v_deck[59], v_deck[40], v_deck[3], v_deck[92], v_deck[47],
    v_deck[34], v_deck[12], v_deck[72], v_deck[65], v_deck[19], v_deck[76], v_deck[57], v_deck[16],
    v_deck[93], v_deck[1], v_deck[46], v_deck[18], v_deck[78], v_deck[23], v_deck[51], v_deck[28],
    v_deck[43], v_deck[96], v_deck[60], v_deck[33], v_deck[2], v_deck[71], v_deck[66], v_deck[41],
    v_deck[74], v_deck[55], v_deck[22], v_deck[99], v_deck[61], v_deck[36], v_deck[48], v_deck[90],
    v_deck[81], v_deck[24], v_deck[68], v_deck[17], v_deck[49], v_deck[30], v_deck[97], v_deck[42],
    v_deck[35], v_deck[62], v_deck[87], v_deck[54], v_deck[15], v_deck[70], v_deck[25], v_deck[80],
    v_deck[52], v_deck[63], v_deck[82], v_deck[4], v_deck[27], v_deck[88], v_deck[56], v_deck[69],
    v_deck[91], v_deck[26], v_deck[44], v_deck[79], v_deck[98], v_deck[75], v_deck[53], v_deck[14],
    v_deck[45], v_deck[73], v_deck[67], v_deck[20], v_deck[95], v_deck[58], v_deck[31], v_deck[9],
    v_deck[84], v_deck[77], v_deck[50], v_deck[37], v_deck[59], v_deck[40], v_deck[3], v_deck[92],
    v_deck[47], v_deck[34], v_deck[12], v_deck[72], v_deck[65], v_deck[19], v_deck[76], v_deck[57],
    v_deck[16], v_deck[93], v_deck[1], v_deck[46], v_deck[18], v_deck[78], v_deck[23], v_deck[51],
    v_deck[28], v_deck[43], v_deck[96], v_deck[60], v_deck[33], v_deck[2], v_deck[71], v_deck[66],
    v_deck[41], v_deck[74], v_deck[55], v_deck[22], v_deck[99], v_deck[61], v_deck[36], v_deck[48],
    v_deck[90], v_deck[81], v_deck[24], v_deck[68], v_deck[17], v_deck[49], v_deck[30], v_deck[97],
    v_deck[42], v_deck[35], v_deck[62], v_deck[87], v_deck[54], v_deck[15], v_deck[70], v_deck[21],
    v_deck[83], v_deck[7], v_deck[29], v_deck[94], v_deck[85], v_deck[13], v_deck[38], v_deck[89],
    v_deck[52], v_deck[63], v_deck[82], v_deck[100], v_deck[6], v_deck[102], v_deck[106], v_deck[103],
    v_deck[8], v_deck[101], v_deck[104], v_deck[105], v_deck[107], v_deck[108]
  ];

  -- 发牌给4个玩家
  FOR v_i IN 0..3 LOOP
    v_hands[v_i + 1] := to_jsonb(v_shuffled_deck[v_i*27:(v_i+1)*27]);
  END LOOP;

  -- 构建state_private.hands
  v_state_private_hands = jsonb_build_object(
    '0', v_hands[1],
    '1', v_hands[2],
    '2', v_hands[3],
    '3', v_hands[4]
  );

  -- 保存手牌到game_hands表
  INSERT INTO public.game_hands (game_id, seat_no, hand)
    SELECT v_game_id, v_i, v_hands[v_i + 1]
    FROM (SELECT generate_series(0, 3) AS v_i);

  -- 保存到state_private
  UPDATE public.games
  SET state_private = jsonb_build_object('hands', v_state_private_hands),
      updated_at = NOW()
  WHERE id = v_game_id;

  -- 记录日志
  RAISE NOTICE 'Game % started successfully in room %', v_game_id, p_room_id;
END;
$$;

-- 授权
GRANT EXECUTE ON FUNCTION public.start_game(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_game(uuid) TO anon;

-- 添加注释
COMMENT ON FUNCTION public.start_game IS '开始一局新游戏，自动完成旧游戏（修复P0001错误）';
