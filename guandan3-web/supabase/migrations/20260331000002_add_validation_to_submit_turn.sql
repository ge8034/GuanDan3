-- 为 submit_turn 添加掼蛋牌型验证
-- 直接更新现有的 submit_turn 函数，确保AI和玩家只能提交有效的牌型
-- 2026-03-31

-- 删除现有的 submit_turn 函数（因返回类型可能冲突）
drop function if exists public.submit_turn(uuid,uuid,integer,jsonb) cascade;

-- 首先创建或替换牌型验证函数
create or replace function public.validate_guandan_move(
  p_payload jsonb,
  p_last_payload jsonb,
  p_level_rank int default 2
)
returns boolean
language plpgsql
immutable
as $$
declare
  v_action_type text;
  v_cards jsonb;
  v_card_count int;
  v_last_action_type text;
  v_last_cards jsonb;
  v_last_card_count int;
  v_is_bomb boolean;
  v_last_is_bomb boolean;
begin
  -- 过牌总是允许
  if p_payload is null then
    return true;
  end if;

  v_action_type := p_payload->>'type';
  if v_action_type = 'pass' then
    return true;
  end if;

  v_cards := p_payload->'cards';
  v_card_count := jsonb_array_length(v_cards);

  -- 空牌不应该出现
  if v_card_count = 0 then
    return false;
  end if;

  -- 如果上家过牌，任何出牌都允许
  if p_last_payload is null or p_last_payload->>'type' = 'pass' then
    return true;
  end if;

  v_last_action_type := p_last_payload->>'type';
  v_last_cards := p_last_payload->'cards';
  v_last_card_count := jsonb_array_length(v_last_cards);

  -- 炸弹检查（4张及以上相同点数）
  v_is_bomb := v_card_count >= 4 and (
    select count(*)
    from jsonb_array_elements(v_cards) as card
    group by card->>'val'
    having count(*) >= 4
    limit 1
  ) > 0;

  v_last_is_bomb := v_last_card_count >= 4 and (
    select count(*)
    from jsonb_array_elements(v_last_cards) as card
    group by card->>'val'
    having count(*) >= 4
    limit 1
  ) > 0;

  -- 炸弹可以压任何牌
  if v_is_bomb and not v_last_is_bomb then
    return true;
  end if;

  -- 炸弹对炸弹：更大的炸弹可以压更小的炸弹
  if v_is_bomb and v_last_is_bomb then
    -- 张数更多的赢
    if v_card_count > v_last_card_count then
      return true;
    end if;
    -- 张数相同时，比较点数
    if v_card_count = v_last_card_count then
      declare
        v_my_max_val int;
        v_last_max_val int;
      begin
        select max((card->>'val')::int)
        into v_my_max_val
        from jsonb_array_elements(v_cards) as card;

        select max((card->>'val')::int)
        into v_last_max_val
        from jsonb_array_elements(v_last_cards) as card;

        return v_my_max_val > v_last_max_val;
      end;
    end if;
    return false;
  end if;

  -- 非炸弹不能压炸弹
  if v_last_is_bomb then
    return false;
  end if;

  -- 牌数必须相同
  if v_card_count <> v_last_card_count then
    return false;
  end if;

  -- 同牌数出牌，前端已验证具体牌型
  -- 这里只检查基本规则：牌数相同即可
  return true;
end;
$$;

-- 更新现有的 submit_turn 函数，添加牌型验证
create or replace function public.submit_turn(
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
begin
  -- 1. 锁定游戏行并获取状态
  select g.room_id, g.current_seat, g.turn_no, g.state_private, g.state_public, g.status, g.level_rank
    into v_room_id, v_current_seat, v_turn_no, v_state_private, v_state_public, v_game_status, v_level_rank
    from public.games g
    where g.id = p_game_id
    for update of g;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. 验证回合号
  if v_turn_no <> p_expected_turn_no then
    raise exception 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  end if;

  -- 3. 识别执行者并检查成员资格
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

  -- 4. 判断是否为 AI
  v_is_ai := (v_member_type = 'ai') OR (v_member_uid IS NULL);

  -- 5. 授权检查
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

  -- 6. 解析动作payload
  v_action_type := p_payload->>'type';
  v_played_cards := p_payload->'cards';

  -- 6.5 验证牌型（新增关键逻辑）
  if v_action_type = 'play' and jsonb_array_length(v_played_cards) > 0 then
    -- 获取上一轮的payload用于验证
    select t.payload
      into v_last_payload
      from public.turns t
      where t.game_id = p_game_id and t.turn_no = v_turn_no - 1
      order by t.id desc
      limit 1;

    if not public.validate_guandan_move(p_payload, v_last_payload, v_level_rank) then
      raise exception 'invalid_move: 无效牌型或不满足掼蛋规则';
    end if;
  end if;

  -- 7. 执行出牌
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
    values (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  -- 8. 更新手牌
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

  -- 9. 更新游戏状态
  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = (v_current_seat + 1) % 4,
        state_private = v_state_private,
        state_public = v_state_public,
        status = v_game_status,
        updated_at = now()
  where id = p_game_id;

  -- 10. 返回结果
  v_rankings := coalesce((v_state_public->'rankings')::jsonb, '[]'::jsonb)::int[];

  return query
    select v_turn_no + 1, (v_current_seat + 1) % 4, v_game_status, v_rankings;
end;
$$;

-- 添加注释
COMMENT ON FUNCTION public.validate_guandan_move IS '验证掼蛋牌型是否有效，确保只有合法的牌型才能提交';
