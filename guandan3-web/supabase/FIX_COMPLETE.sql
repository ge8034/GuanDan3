-- 完整修复：start_game 和 submit_turn 函数
-- 修复 counts 数组的 jsonb 类型处理

-- 1. 修复 start_game
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

  IF v_room_status = 'playing' THEN
    IF EXISTS (
      SELECT 1 FROM public.games
      WHERE room_id = p_room_id AND status = 'playing'
    ) THEN
      RAISE EXCEPTION 'A game is already playing in this room';
    END IF;
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

  SELECT array_agg(x ORDER BY gen_random_uuid())
    INTO v_shuffled_deck
  FROM unnest(v_deck) AS x;

  FOR v_i IN 1..108 LOOP
    v_hands[(v_i - 1) % 4 + 1] := v_hands[(v_i - 1) % 4 + 1] || v_shuffled_deck[v_i];
  END LOOP;

  v_state_private_hands = jsonb_build_object(
    '0', v_hands[1],
    '1', v_hands[2],
    '2', v_hands[3],
    '3', v_hands[4]
  );

  INSERT INTO public.games (room_id, seed, status, turn_no, current_seat, state_public, state_private)
  VALUES (
    p_room_id,
    (floor(random() * 9000000000) + 1000000000)::bigint,
    'playing',
    0,
    0,
    jsonb_build_object('counts', to_jsonb(array[27, 27, 27, 27]), 'rankings', '[]'::jsonb, 'levelRank', v_level_rank),
    jsonb_build_object('hands', v_state_private_hands)
  )
  RETURNING id INTO v_game_id;

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


-- 2. 修复 submit_turn - 使用 jsonb 操作处理 counts
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

  SELECT payload INTO v_last_payload
  FROM public.turns
  WHERE game_id = p_game_id
  ORDER BY turns.turn_no DESC
  LIMIT 1;

  INSERT INTO public.turns(game_id, turn_no, seat_no, action_id, payload)
  VALUES (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  IF v_action_type = 'play' AND jsonb_array_length(v_played_cards) > 0 THEN
    v_hands := v_state_private->'hands';
    v_my_hand := v_hands->(v_current_seat::text);

    IF v_my_hand IS NULL THEN
      v_my_hand := '[]'::jsonb;
    END IF;

    v_new_hand := v_my_hand;

    IF v_new_hand IS NULL THEN
      v_new_hand := '[]'::jsonb;
    END IF;

    v_hand_length := COALESCE(jsonb_array_length(v_new_hand), 0);

    FOR v_card_to_remove IN SELECT * FROM jsonb_array_elements(v_played_cards) LOOP
      v_card_id := (v_card_to_remove->>'id')::int;

      v_found := false;
      FOR v_card_idx IN 0..v_hand_length-1 LOOP
        IF v_card_idx < jsonb_array_length(v_new_hand) THEN
          IF (v_new_hand->v_card_idx->>'id')::int = v_card_id THEN
            v_new_hand := v_new_hand - v_card_idx;
            v_found := true;
            EXIT;
          END IF;
        END IF;
      END LOOP;

      IF NOT v_found THEN
        RAISE EXCEPTION 'Card not found in hand: card_id=%', v_card_id;
      END IF;

      v_hand_length := jsonb_array_length(v_new_hand);
    END LOOP;

    v_state_private := jsonb_set(
      v_state_private,
      ARRAY['hands', v_current_seat::text],
      v_new_hand
    );

    -- 修复：使用 jsonb 操作更新 counts
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

    IF NOT v_is_ai THEN
      SELECT uid INTO v_human_uid
      FROM public.room_members
      WHERE room_id = v_room_id AND seat_no = v_current_seat;

      IF v_human_uid IS NOT NULL THEN
        INSERT INTO public.game_hands (game_id, uid, hand)
        VALUES (p_game_id, v_human_uid, v_new_hand)
        ON CONFLICT (game_id, uid) DO UPDATE
        SET hand = EXCLUDED.hand,
            updated_at = NOW();
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
