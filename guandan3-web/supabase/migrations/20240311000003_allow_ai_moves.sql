-- 20240311000003_allow_ai_moves.sql
-- Allow AI moves to be submitted by any room member in PVE mode

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
  v_room_mode text;
begin
  -- 1. Lock game and get state
  select g.room_id, g.current_seat, g.turn_no, r.mode
    into v_room_id, v_current_seat, v_turn_no, v_room_mode
  from public.games g
  join public.rooms r on r.id = g.room_id
  where g.id = p_game_id
  for update;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. Validate Turn Number (Concurrency check)
  if v_turn_no <> p_expected_turn_no then
    -- Return current state in error message to help debugging/sync
    raise exception 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  end if;

  -- 3. Identify Actor (Who is supposed to play?)
  -- Check if the current seat is occupied by AI or Human
  select 
    (member_type = 'ai'), 
    seat_no
  into 
    v_is_ai, 
    v_actor_seat
  from public.room_members
  where room_id = v_room_id and seat_no = v_current_seat;

  if v_actor_seat is null then
    raise exception 'Current seat is empty? This should not happen.';
  end if;

  -- 4. Authorize Action
  if v_is_ai then
    -- If AI turn:
    -- In PVE mode, ANY human member can trigger AI move (usually the local client logic)
    -- We just verify the caller is a member of this room
    if not exists (
      select 1 from public.room_members 
      where room_id = v_room_id and uid = auth.uid()
    ) then
      raise exception 'Unauthorized: Only room members can trigger AI moves';
    end if;
  else
    -- If Human turn:
    -- The caller MUST be the user at this seat
    select seat_no into v_my_seat
    from public.room_members
    where room_id = v_room_id and uid = auth.uid();

    if v_my_seat is null or v_my_seat <> v_current_seat then
      raise exception 'Not your turn (You are seat %, Current is %)', v_my_seat, v_current_seat;
    end if;
  end if;

  -- 5. Execute Move
  -- Insert turn record
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
  values (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  -- Update game state
  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = (v_current_seat + 1) % 4,
        updated_at = now()
  where id = p_game_id;

  return query
    select v_turn_no + 1, (v_current_seat + 1) % 4;
end;
$$;
