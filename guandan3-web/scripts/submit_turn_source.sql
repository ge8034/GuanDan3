CREATE OR REPLACE FUNCTION public.submit_turn(p_game_id uuid, p_action_id uuid, p_expected_turn_no integer, p_payload jsonb)
 RETURNS TABLE(turn_no integer, current_seat integer, status text, rankings integer[])
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
declare
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
  v_new_counts int[4];
  v_rankings int[4];
  v_game_status text;
  v_count_value int;
  v_rank_value int;
  v_idx int;
begin
  -- 1. Lock game and get state
  select g.room_id, g.current_seat, g.turn_no, g.state_private, g.state_public, g.status
    into v_room_id, v_current_seat, v_turn_no, v_state_private, v_state_public, v_game_status
    from public.games g
    where g.id = p_game_id
    for update;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 游戏已结束检查
  if v_game_status = 'finished' then
    raise exception 'Game is already finished';
  end if;

  -- 2. Validate Turn Number
  if v_turn_no <> p_expected_turn_no then
    raise exception 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  end if;

  -- 3. Identify Actor and check membership
  select
    member_type,
    uid,
    seat_no
  into
    v_member_type,
    v_member_uid,
    v_actor_seat
  from public.room_members
  where room_id = v_room_id and seat_no = v_current_seat;

  if v_actor_seat is null then
    raise exception 'Current seat % is empty!', v_current_seat;
  end if;

  -- 4. Determine if AI
  v_is_ai := (v_member_type = 'ai') OR (v_member_uid IS NULL);

  -- 5. Authorize Action
  if v_is_ai then
    select exists(
      select 1 from public.room_members
      where room_id = v_room_id and uid = auth.uid()
    ) into v_is_member;

    if not v_is_member then
      raise exception 'Unauthorized: Only room members can trigger AI moves';
    end if;
  else
    select seat_no into v_my_seat
    from public.room_members
    where room_id = v_room_id and uid = auth.uid();

    if v_my_seat is null or v_my_seat <> v_current_seat then
      raise exception 'not_your_turn: You are Seat %, Current is Seat %',
        v_my_seat, v_current_seat;
    end if;
  end if;

  -- 6. Parse action payload
  v_action_type := p_payload->>'type';
  v_played_cards := p_payload->'cards';

  -- 7. Execute Move
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
  values (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  -- 8. Update state_private.hands if playing cards
  if v_action_type = 'play' and jsonb_array_length(v_played_cards) > 0 then
    -- 获取当前手牌
    v_hands := v_state_private->'hands';

    -- 获取当前玩家的手牌 (seat as string key)
    v_my_hand := v_hands->(v_current_seat::text);

    -- 从手牌中移除已出的牌
    v_new_hand := v_my_hand;
    for v_card_to_remove in select * from jsonb_array_elements(v_played_cards) loop
      v_card_id := (v_card_to_remove->>'id')::int;

      -- 在手牌中找到这张牌并移除
      v_found := false;
      for v_card_idx in 0..jsonb_array_length(v_new_hand)-1 loop
        if (v_new_hand->v_card_idx->>'id')::int = v_card_id then
          -- 移除这张牌
          v_new_hand := v_new_hand - v_card_idx;
          v_found := true;
          exit;
        end if;
      end loop;

      if not v_found then
        raise exception 'Card not found in hand: card_id=%', v_card_id;
      end if;
    end loop;

    -- 更新 state_private
    v_state_private := jsonb_set(
      v_state_private,
      array['hands', v_current_seat::text],
      v_new_hand
    );

    -- 更新 counts - 修复类型转换
    -- 从 jsonb 数组中正确提取整数值
    v_new_counts := int[4];
    v_new_counts[1] := 27;
    v_new_counts[2] := 27;
    v_new_counts[3] := 27;
    v_new_counts[4] := 27;

    if v_state_public ? 'counts' then
      v_idx := 1;
      for v_count_value in select (elem->>0)::int from jsonb_array_elements(v_state_public->'counts') loop
        if v_idx >= 1 and v_idx <= 4 then
          v_new_counts[v_idx] := v_count_value;
        end if;
        v_idx := v_idx + 1;
      end loop;
    end if;

    -- 设置当前玩家的新手牌数量
    v_new_counts[v_current_seat + 1] := jsonb_array_length(v_new_hand);

    v_state_public := jsonb_set(
      coalesce(v_state_public, '{}'::jsonb),
      array['counts'],
      to_jsonb(v_new_counts)
    );

    -- 检查是否有玩家出完牌
    if jsonb_array_length(v_new_hand) = 0 then
      -- 添加到排名 - 修复类型转换错误
      v_rankings := int[4];
      v_idx := 1;

      if v_state_public ? 'rankings' then
        for v_rank_value in select (elem->>0)::int from jsonb_array_elements(v_state_public->'rankings') loop
          if v_idx >= 1 and v_idx <= 4 then
            v_rankings[v_idx] := v_rank_value;
          end if;
          v_idx := v_idx + 1;
        end loop;
      end if;

      v_rankings[v_idx] := v_current_seat;
      v_state_public := jsonb_set(
        v_state_public,
        array['rankings'],
        to_jsonb(v_rankings)
      );

      -- 检查游戏是否结束
      if v_idx >= 3 then
        v_game_status := 'finished';
      end if;
    end if;
  end if;

  -- 9. Update game state
  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = (v_current_seat + 1) % 4,
        state_private = v_state_private,
        state_public = v_state_public,
        status = v_game_status,
        updated_at = now()
    where id = p_game_id;

  -- 10. Return result
  return query
    select v_turn_no + 1, (v_current_seat + 1) % 4, v_game_status, v_rankings;
end;
$function$
