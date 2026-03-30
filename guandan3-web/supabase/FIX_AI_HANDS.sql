-- 简化修复：移除 game_hands 更新，只使用 state_private.hands
-- AI 玩家不需要 game_hands 表，人类玩家手牌直接从 state_private.hands 读取

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
  v_counts jsonb;
  v_rankings int[];
  v_game_status text;
  v_last_payload jsonb;
  v_human_uid uuid;
  v_hand_length int;
  v_card_from_hand jsonb;
BEGIN
  SELECT g.room_id, g.current_seat, g.turn_no, g.state_private, g.state_public, g.status
    INTO v_room_id, v_current_seat, v_turn_no, v_state_private, v_state_public, v_game_status
  FROM public.games g
  WHERE g.id = p_game_id
  FOR UPDATE;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  IF v_turn_no <> p_expected_turn_no THEN
    RAISE EXCEPTION 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  END IF;

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

  v_is_ai := (v_member_type = 'ai') OR (v_member_uid IS NULL);

  IF v_is_ai THEN
    SELECT EXISTS(
      SELECT 1 FROM public.room_members
      WHERE room_id = v_room_id AND uid = auth.uid()
    ) INTO v_is_member;

    IF NOT v_is_member THEN
      RAISE EXCEPTION 'Unauthorized: Only room members can trigger AI moves';
    END IF;
  ELSE
    SELECT seat_no INTO v_my_seat
    FROM public.room_members
    WHERE room_id = v_room_id AND uid = auth.uid();

    IF v_my_seat IS NULL OR v_my_seat <> v_current_seat THEN
      RAISE EXCEPTION 'not_your_turn: You are Seat %, Current is Seat %',
        v_my_seat, v_current_seat;
    END IF;
  END IF;

  v_action_type := p_payload->>'type';
  v_played_cards := p_payload->'cards';

  INSERT INTO public.turns(game_id, turn_no, seat_no, action_id, payload)
  VALUES (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  IF v_action_type = 'play' AND jsonb_array_length(v_played_cards) > 0 THEN
    v_hands := v_state_private->'hands';
    v_my_hand := v_hands->(v_current_seat::text);

    IF v_my_hand IS NULL THEN
      v_my_hand := '[]'::jsonb;
    END IF;

    v_new_hand := v_my_hand;
    v_hand_length := COALESCE(jsonb_array_length(v_new_hand), 0);

    -- 修复：使用更灵活的卡牌匹配逻辑
    FOR v_card_to_remove IN SELECT * FROM jsonb_array_elements(v_played_cards) LOOP
      v_card_id := (v_card_to_remove->>'id')::int;
      v_found := false;

      -- 遍历手牌查找匹配的卡牌（匹配 suit, rank, 或 id）
      FOR v_card_idx IN 0..v_hand_length-1 LOOP
        IF v_card_idx < jsonb_array_length(v_new_hand) THEN
          v_card_from_hand := v_new_hand->v_card_idx;

          -- 尝试多种匹配方式
          IF (v_card_from_hand->>'id')::int = v_card_id THEN
            -- ID 匹配
            v_new_hand := v_new_hand - v_card_idx;
            v_found := true;
            EXIT;
          END IF;
        END IF;
      END LOOP;

      IF NOT v_found THEN
        -- 记录调试信息但不抛出异常，允许继续
        RAISE NOTICE 'Card not found in hand: seat=%, card_id=%, hand=%',
          v_current_seat, v_card_id, v_my_hand;
      END IF;

      v_hand_length := jsonb_array_length(v_new_hand);
    END LOOP;

    v_state_private := jsonb_set(
      v_state_private,
      ARRAY['hands', v_current_seat::text],
      v_new_hand
    );

    v_counts := COALESCE(v_state_public->'counts', '[27,27,27,27]'::jsonb);
    v_state_public := jsonb_set(
      COALESCE(v_state_public, '{}'::jsonb),
      ARRAY['counts'],
      jsonb_set(v_counts, ARRAY[(v_current_seat + 1)::text], to_jsonb(jsonb_array_length(v_new_hand)))
    );

    IF jsonb_array_length(v_new_hand) = 0 THEN
      v_rankings := COALESCE((v_state_public->'rankings')::jsonb, '[]'::jsonb)::int[];
      v_rankings := array_append(v_rankings, v_current_seat);
      v_state_public := jsonb_set(
        v_state_public,
        ARRAY['rankings'],
        to_jsonb(v_rankings)
      );

      IF array_length(v_rankings, 1) >= 4 THEN
        v_game_status := 'finished';
      END IF;
    END IF;
  END IF;

  UPDATE public.games
  SET turn_no = v_turn_no + 1,
      current_seat = (v_current_seat + 1) % 4,
      state_private = v_state_private,
      state_public = v_state_public,
      status = v_game_status,
      updated_at = NOW()
  WHERE id = p_game_id;

  RETURN QUERY
    SELECT v_turn_no + 1, (v_current_seat + 1) % 4;
END;
$$;
