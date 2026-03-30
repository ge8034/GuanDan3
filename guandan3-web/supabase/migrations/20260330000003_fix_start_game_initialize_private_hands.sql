-- 修复 start_game 函数以初始化 state_private.hands
-- 问题：submit_turn 从 state_private.hands 读取手牌，但 start_game 从未初始化这个字段
-- 解决：在 start_game 中初始化 state_private.hands

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
  SELECT status, mode, type, owner_uid
    INTO v_room_status, v_room_mode, v_room_type, v_owner_uid
  FROM public.rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_room_status IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  IF v_owner_uid <> auth.uid() THEN
    RAISE EXCEPTION 'Only the room owner can start a game';
  END IF;

  -- 如果房间状态是playing但游戏已结束，允许重新开始
  IF v_room_status = 'playing' THEN
    -- 检查是否有正在进行的游戏
    IF EXISTS (
      SELECT 1 FROM public.games
      WHERE room_id = p_room_id AND status = 'playing'
    ) THEN
      RAISE EXCEPTION 'A game is already playing in this room';
    END IF;

    -- 如果没有正在进行的游戏，将房间状态设为open
    UPDATE public.rooms SET status = 'open' WHERE id = p_room_id;
    v_room_status := 'open';
  END IF;

  IF v_room_status <> 'open' THEN
    RAISE EXCEPTION 'Room is not ready (Status: %)', v_room_status;
  END IF;

  v_is_rematch := EXISTS (
    SELECT 1 FROM public.games
    WHERE room_id = p_room_id AND status = 'finished'
  );

  IF v_room_mode = 'pvp4' THEN
    SELECT COUNT(*), COUNT(*) FILTER (WHERE ready = true)
      INTO v_member_count, v_ready_count
    FROM public.room_members
    WHERE room_id = p_room_id;

    IF v_member_count < 4 THEN
      RAISE EXCEPTION 'Need 4 players to start (Current: %)', v_member_count;
    END IF;

    IF NOT v_is_rematch AND v_ready_count < 4 THEN
      RAISE EXCEPTION 'Not all players are ready (%/4)', v_ready_count;
    END IF;
  END IF;

  SELECT COUNT(*)
    INTO v_finished_count
  FROM public.games
  WHERE room_id = p_room_id AND status = 'finished';

  v_level_rank := 2 + (v_finished_count % 13);

  -- 生成两副牌
  FOR d IN 0..1 LOOP
    FOREACH v_suit IN ARRAY v_suits LOOP
      FOR r IN 1..13 LOOP
        v_rank := v_ranks[r];
        v_val := r + 1;
        v_card := jsonb_build_object(
          'suit', v_suit,
          'rank', v_rank,
          'val', v_val,
          'id', (d * 54) + ((CASE WHEN v_suit='H' THEN 0 WHEN v_suit='D' THEN 13 WHEN v_suit='C' THEN 26 ELSE 39 END) + r)
        );
        v_deck := array_append(v_deck, v_card);
      END LOOP;
    END LOOP;
    v_deck := array_append(v_deck, jsonb_build_object('suit', 'J', 'rank', 'sb', 'val', 20, 'id', (d*54)+53));
    v_deck := array_append(v_deck, jsonb_build_object('suit', 'J', 'rank', 'hr', 'val', 30, 'id', (d*54)+54));
  END LOOP;

  -- 洗牌
  SELECT array_agg(x ORDER BY gen_random_uuid())
    INTO v_shuffled_deck
  FROM unnest(v_deck) AS x;

  -- 发牌
  FOR v_i IN 1..108 LOOP
    v_hands[(v_i - 1) % 4 + 1] := v_hands[(v_i - 1) % 4 + 1] || v_shuffled_deck[v_i];
  END LOOP;

  -- 构建 state_private.hands JSON
  v_state_private_hands = jsonb_build_object(
    '0', v_hands[1],
    '1', v_hands[2],
    '2', v_hands[3],
    '3', v_hands[4]
  );

  -- 创建游戏记录，包含 state_private
  INSERT INTO public.games (room_id, seed, status, turn_no, current_seat, state_public, state_private)
  VALUES (
    p_room_id,
    (floor(random() * 9000000000) + 1000000000)::bigint,
    'playing',
    0,
    0,
    jsonb_build_object('counts', array[27, 27, 27, 27], 'rankings', '[]'::jsonb, 'levelRank', v_level_rank),
    jsonb_build_object('hands', v_state_private_hands)
  )
  RETURNING id INTO v_game_id;

  -- 插入 game_hands 记录（用于人类玩家）
  INSERT INTO public.game_hands (game_id, seat_no, hand)
  VALUES
    (v_game_id, 0, v_hands[1]),
    (v_game_id, 1, v_hands[2]),
    (v_game_id, 2, v_hands[3]),
    (v_game_id, 3, v_hands[4]);

  UPDATE public.room_members
    SET ready = false,
        last_seen_at = NOW()
  WHERE room_id = p_room_id;

  UPDATE public.rooms SET status = 'playing' WHERE id = p_room_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_game(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_game(uuid) TO anon;

COMMENT ON FUNCTION public.start_game IS '开始一局新游戏，初始化 state_private.hands 和 game_hands';
