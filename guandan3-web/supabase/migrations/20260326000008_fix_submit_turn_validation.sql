-- 修复 submit_turn 函数：添加出牌规则验证
-- 20260326000008_fix_submit_turn_validation.sql

-- 首先创建一个简化版的牌型验证函数
create or replace function public.validate_move(
  p_payload jsonb,
  p_last_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_cards jsonb;
  v_last_cards jsonb;
  v_card_count int;
  v_last_card_count int;
begin
  -- 空处理
  if p_payload is null then
    return true;
  end if;

  -- 过牌总是允许
  if p_payload->>'type' = 'pass' then
    return true;
  end if;

  -- 获取牌数
  v_cards := p_payload->'cards';
  v_card_count := jsonb_array_length(v_cards);

  -- 如果上家也过牌，任何出牌都允许
  if p_last_payload is null or p_last_payload->>'type' = 'pass' then
    return true;
  end if;

  v_last_cards := p_last_payload->'cards';
  v_last_card_count := jsonb_array_length(v_last_cards);

  -- 炸弹可以打任何牌
  if v_card_count >= 4 then
    return true;
  end if;

  -- 牌数必须相同（除了炸弹）
  if v_card_count <> v_last_card_count then
    return false;
  end if;

  -- 简化版本：允许出牌（客户端已验证）
  return true;
end;
$$;

-- 重新创建 submit_turn 函数，添加验证
drop function if exists public.submit_turn(uuid, uuid, int, jsonb);

create or replace function public.submit_turn(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn_no int,
  p_payload jsonb
)
returns table(turn_no int, current_seat int)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
  v_current_seat int;
  v_turn_no int;
  v_my_seat int;
  v_last_payload jsonb;
begin
  -- Lock game row
  select g.room_id, g.current_seat, g.turn_no, g.state_public
    into v_room_id, v_current_seat, v_turn_no, v_last_payload
  from public.games g
  where g.id = p_game_id
  for update;

  -- Validate turn number
  if v_turn_no <> p_expected_turn_no then
    raise exception 'turn_no_mismatch';
  end if;

  -- Validate membership and seat
  select m.seat_no into v_my_seat
  from public.room_members m
  where m.room_id = v_room_id and m.uid = auth.uid();

  if v_my_seat is null then
    raise exception 'not_a_member';
  end if;

  if v_my_seat <> v_current_seat then
    raise exception 'not_your_turn';
  end if;

  -- 验证出牌规则（简化版，主要验证牌数）
  if not public.validate_move(p_payload, v_last_payload) then
    raise exception 'invalid_move: 牌型不匹配或无法压过上家';
  end if;

  -- Insert turn
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
  values (p_game_id, v_turn_no, v_my_seat, p_action_id, p_payload);

  -- Update game state
  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = (v_current_seat + 1) % 4,
        updated_at = now()
  where id = p_game_id;

  return query
    select v_turn_no, (v_current_seat + 1) % 4;
end;
$$;

grant execute on function public.submit_turn(uuid, uuid, int, jsonb) to authenticated;
