-- 20240311000004_fix_submit_turn_debug.sql
-- Improve submit_turn to be more robust and provide better debug info

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
  v_actor_seat int;
  v_is_ai boolean;
  v_member_type text;
  v_member_uid uuid;
begin
  -- 1. Lock game and get state
  select g.room_id, g.current_seat, g.turn_no
    into v_room_id, v_current_seat, v_turn_no
  from public.games g
  where g.id = p_game_id
  for update;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. Validate Turn Number
  if v_turn_no <> p_expected_turn_no then
    raise exception 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  end if;

  -- 3. Identify Actor
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
  -- Robust check: AI if type is 'ai' OR if uid is null
  v_is_ai := (v_member_type = 'ai') OR (v_member_uid IS NULL);

  -- 5. Authorize Action
  if v_is_ai then
    -- Any member can trigger AI move
    if not exists (
      select 1 from public.room_members 
      where room_id = v_room_id and uid = auth.uid()
    ) then
      raise exception 'Unauthorized: Only room members can trigger AI moves';
    end if;
  else
    -- Human turn check
    select seat_no into v_my_seat
    from public.room_members
    where room_id = v_room_id and uid = auth.uid();

    if v_my_seat is null or v_my_seat <> v_current_seat then
      -- Enhanced error message for debugging
      raise exception 'not_your_turn: You are Seat %, Current is Seat % (Type: %, UID: %)', 
        v_my_seat, v_current_seat, v_member_type, v_member_uid;
    end if;
  end if;

  -- 6. Execute Move
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
  values (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = (v_current_seat + 1) % 4,
        updated_at = now()
  where id = p_game_id;

  return query
    select v_turn_no + 1, (v_current_seat + 1) % 4;
end;
$$;
