-- 修复 submit_turn 函数中的 null 手牌问题
-- 问题：当玩家手牌为 null 时，jsonb_array_length 返回 null 导致 FOR 循环失败
-- 解决：在处理前检查并初始化 null 手牌为空数组

CREATE OR REPLACE FUNCTION public.submit_turn(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn_no int,
  p_payload jsonb
)
RETURNS TABLE(turn_no int, current_seat int)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_room_id uuid;
  v_current_seat int;
  v_turn_no int;
  v_my_seat int;
  v_actor_seat int;
  v_is_ai boolean;
  v_member_type text;
  v_member_uid uuid;
  v_is_member boolean;
  v_action_type text;
  v_played_cards jsonb;
  v_state_private jsonb;
  v_state_public jsonb;
  v_hands jsonb;
  v_my_hand jsonb;
  v_new_hand jsonb;
  v_card_id int;
  v_card_to_remove jsonb;
  v_card_idx int;
  v_found boolean;
  v_counts int[];
  v_rankings int[];
  v_game_status text;
  v_last_payload jsonb;
  v_human_uid uuid;
  v_hand_length int;
BEGIN
  -- 1. Lock game and get state
  SELECT g.room_id, g.current_seat, g.turn_no, g.state_private, g.state_public, g.status
    INTO v_room_id, v_current_seat, v_turn_no, v_state_private, v_state_public, v_game_status
  FROM public.games g
  WHERE g.id = p_game_id
  FOR UPDATE;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  -- 2. Validate Turn Number
  IF v_turn_no <> p_expected_turn_no THEN
    RAISE EXCEPTION 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  END IF;

  -- 3. Identify Actor and check membership
  SELECT
    member_type,
    uid,
    seat_no
  INTO
    v_member_type,
    v_member_uid,
    v_actor_seat
  FROM public.room_members
  WHERE room_id = v_room_id AND seat_no = v_current_seat;

  IF v_actor_seat IS NULL THEN
    RAISE EXCEPTION 'Current seat % is empty!', v_current_seat;
  END IF;

  -- 4. Determine if AI
  v_is_ai := (v_member_type = 'ai') OR (v_member_uid IS NULL);

  -- 5. Authorize Action
  IF v_is_ai THEN
    -- Any member can trigger AI move
    SELECT EXISTS(
      SELECT 1 FROM public.room_members
      WHERE room_id = v_room_id AND uid = auth.uid()
    ) INTO v_is_member;

    IF NOT v_is_member THEN
      RAISE EXCEPTION 'Unauthorized: Only room members can trigger AI moves';
    END IF;
  ELSE
    -- Human turn check
    SELECT seat_no INTO v_my_seat
    FROM public.room_members
    WHERE room_id = v_room_id AND uid = auth.uid();

    IF v_my_seat IS NULL OR v_my_seat <> v_current_seat THEN
      RAISE EXCEPTION 'not_your_turn: You are Seat %, Current is Seat %',
        v_my_seat, v_current_seat;
    END IF;
  END IF;

  -- 6. Parse action payload
  v_action_type := p_payload->>'type';
  v_played_cards := p_payload->'cards';

  -- 获取上一次出牌（用于验证）
  SELECT payload INTO v_last_payload
  FROM public.turns
  WHERE game_id = p_game_id
  ORDER BY turns.turn_no DESC
  LIMIT 1;

  -- 7. Execute Move
  INSERT INTO public.turns(game_id, turn_no, seat_no, action_id, payload)
  VALUES (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  -- 8. Update state_private.hands if playing cards
  IF v_action_type = 'play' AND jsonb_array_length(v_played_cards) > 0 THEN
    -- 获取当前手牌
    v_hands := v_state_private->'hands';

    -- 获取当前玩家的手牌 (seat as string key)
    v_my_hand := v_hands->(v_current_seat::text);

    -- 修复：如果手牌为 null，初始化为空数组
    IF v_my_hand IS NULL THEN
      v_my_hand := '[]'::jsonb;
    END IF;

    -- 从手牌中移除已出的牌
    v_new_hand := v_my_hand;

    -- 安全检查：确保 v_new_hand 不为 null
    IF v_new_hand IS NULL THEN
      v_new_hand := '[]'::jsonb;
    END IF;

    -- 获取手牌长度（用于循环）
    v_hand_length := COALESCE(jsonb_array_length(v_new_hand), 0);

    FOR v_card_to_remove IN SELECT * FROM jsonb_array_elements(v_played_cards) LOOP
      v_card_id := (v_card_to_remove->>'id')::int;

      -- 在手牌中找到这张牌并移除
      v_found := false;
      FOR v_card_idx IN 0..v_hand_length-1 LOOP
        -- 检查索引是否有效（数组可能因为删除而变小）
        IF v_card_idx < jsonb_array_length(v_new_hand) THEN
          IF (v_new_hand->v_card_idx->>'id')::int = v_card_id THEN
            -- 移除这张牌
            v_new_hand := v_new_hand - v_card_idx;
            v_found := true;
            EXIT;
          END IF;
        END IF;
      END LOOP;

      IF NOT v_found THEN
        RAISE EXCEPTION 'Card not found in hand: card_id=%', v_card_id;
      END IF;

      -- 更新手牌长度
      v_hand_length := jsonb_array_length(v_new_hand);
    END LOOP;

    -- 更新 state_private
    v_state_private := jsonb_set(
      v_state_private,
      ARRAY['hands', v_current_seat::text],
      v_new_hand
    );

    -- 更新 counts
    v_counts := COALESCE((v_state_public->'counts')::jsonb, jsonb_build_array(27,27,27,27))::int[];
    v_counts[v_current_seat + 1] := jsonb_array_length(v_new_hand);
    v_state_public := jsonb_set(
      COALESCE(v_state_public, '{}'::jsonb),
      ARRAY['counts'],
      to_jsonb(v_counts)
    );

    -- 检查是否有玩家出完牌
    IF jsonb_array_length(v_new_hand) = 0 THEN
      -- 添加到排名
      v_rankings := COALESCE((v_state_public->'rankings')::jsonb, '[]'::jsonb)::int[];
      v_rankings := array_append(v_rankings, v_current_seat);
      v_state_public := jsonb_set(
        v_state_public,
        ARRAY['rankings'],
        to_jsonb(v_rankings)
      );

      -- 检查游戏是否结束
      IF array_length(v_rankings, 1) >= 4 THEN
        v_game_status := 'finished';
      END IF;
    END IF;

    -- 9. Update game_hands for human players only
    -- AI 玩家没有 uid，不能在 game_hands 表中创建记录
    IF NOT v_is_ai THEN
      -- 获取人类玩家的 uid
      SELECT uid INTO v_human_uid
      FROM public.room_members
      WHERE room_id = v_room_id AND seat_no = v_current_seat;

      IF v_human_uid IS NOT NULL THEN
        -- 使用 INSERT ... ON CONFLICT 来更新或创建记录
        INSERT INTO public.game_hands (game_id, uid, hand)
        VALUES (p_game_id, v_human_uid, v_new_hand)
        ON CONFLICT (game_id, uid) DO UPDATE
        SET hand = EXCLUDED.hand,
            updated_at = NOW();
      END IF;
    END IF;
  END IF;

  -- 10. Update game state
  UPDATE public.games
  SET turn_no = v_turn_no + 1,
      current_seat = (v_current_seat + 1) % 4,
      state_private = v_state_private,
      state_public = v_state_public,
      status = v_game_status,
      updated_at = NOW()
  WHERE id = p_game_id;

  -- 11. Return result
  RETURN QUERY
    SELECT v_turn_no + 1, (v_current_seat + 1) % 4;
END;
$$;

-- 添加注释
COMMENT ON FUNCTION public.submit_turn IS '提交玩家出牌动作，支持AI移动，正确处理 null 手牌，更新 state_private.hands 和 game_hands（仅人类玩家）';
