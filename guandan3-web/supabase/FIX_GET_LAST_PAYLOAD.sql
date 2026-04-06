-- 修复 submit_turn_validated 中查询 last_payload 的逻辑
-- 正确查询最近一个非 pass 的回合，而不是仅仅查询前一轮
-- 2026-04-01

-- 1. 删除旧函数
drop function if exists public.submit_turn_validated(uuid, uuid, int, jsonb);

-- 2. 创建修复后的函数
create or replace function public.submit_turn_validated(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn_no int,
  p_payload jsonb
)
returns table(turn_no int, current_seat int, status text, rankings int[])
language plpgsql
security definer
set search_path = public, auth
as $$
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
  v_level_rank int;
  v_state_private jsonb;
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
begin
  -- 1. Lock game and get state
  select g.room_id, g.current_seat, g.turn_no, g.state_private, g.state_public, g.status, g.level_rank
    into v_room_id, v_current_seat, v_turn_no, v_state_private, v_state_public, v_game_status, v_level_rank
    from public.games g
    where g.id = p_game_id
    for update of g;

  if v_room_id is null then
    raise exception 'Game not found';
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

  -- 6.5 验证牌型（修复：查询最近一个非 pass 的回合）
  if v_action_type = 'play' and jsonb_array_length(v_played_cards) > 0 then
    -- 修复：查找最近一个实际出牌的回合（type 不等于 'pass'）
    -- 而不是仅仅查询 turn_no = v_turn_no - 1
    select t.payload
      into v_last_payload
      from public.turns t
      where t.game_id = p_game_id
        and t.turn_no < v_turn_no
        and (t.payload->>'type') <> 'pass'  -- 关键修复：过滤掉 pass
      order by t.turn_no desc
      limit 1;

    if not public.validate_guandan_move(p_payload, v_last_payload, v_level_rank) then
      raise exception 'invalid_move: 无效牌型或不满足掼蛋规则';
    end if;
  end if;

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

    -- 更新 counts
    v_counts := coalesce((v_state_public->'counts')::jsonb, jsonb_build_array(27,27,27,27))::int[];
    v_counts[v_current_seat + 1] := jsonb_array_length(v_new_hand);
    v_state_public := jsonb_set(
      coalesce(v_state_public, '{}'::jsonb),
      array['counts'],
      to_jsonb(v_counts)
    );

    -- 检查是否有玩家出完牌
    if jsonb_array_length(v_new_hand) = 0 then
      -- 添加到排名
      v_rankings := coalesce((v_state_public->'rankings')::jsonb, '[]'::jsonb)::int[];
      v_rankings := array_append(v_rankings, v_current_seat);
      v_state_public := jsonb_set(
        v_state_public,
        array['rankings'],
        to_jsonb(v_rankings)
      );

      -- 检查游戏是否结束
      if array_length(v_rankings, 1) >= 3 then
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
  v_rankings := coalesce((v_state_public->'rankings')::jsonb, '[]'::jsonb)::int[];

  return query
    select v_turn_no + 1, (v_current_seat + 1) % 4, v_game_status, v_rankings;
end;
$$;

-- 添加注释
COMMENT ON FUNCTION public.submit_turn_validated IS '带牌型验证的submit_turn函数（修复last_payload查询逻辑）';
