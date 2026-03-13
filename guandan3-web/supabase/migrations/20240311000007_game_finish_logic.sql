-- 20240311000007_game_finish_logic.sql
-- Handles game finishing logic, rankings, and skipping finished players.

-- Drop existing function first because return type has changed
drop function if exists public.submit_turn(uuid, uuid, int, jsonb);

create or replace function public.submit_turn(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn_no int,
  p_payload jsonb
)
returns table(turn_no int, current_seat int, status text, rankings jsonb)
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
  v_hand jsonb;
  v_rankings jsonb;
  v_next_seat int;
  v_status text;
  v_loop_count int;
  v_counts jsonb;
  v_new_counts int[];
begin
  -- 1. Lock game and get state
  select 
    g.room_id, g.current_seat, g.turn_no, g.status, 
    coalesce(g.state_public->'rankings', '[]'::jsonb),
    coalesce(g.state_public->'counts', '[27,27,27,27]'::jsonb)
    into v_room_id, v_current_seat, v_turn_no, v_status, v_rankings, v_counts
  from public.games g
  where g.id = p_game_id
  for update;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  if v_status <> 'playing' then
    raise exception 'Game is not playing (Status: %)', v_status;
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

  -- 4. Determine if AI & Authorize
  v_is_ai := (v_member_type = 'ai') OR (v_member_uid IS NULL);

  if v_is_ai then
    if not exists (select 1 from public.room_members where room_id = v_room_id and uid = auth.uid()) then
      raise exception 'Unauthorized: Only room members can trigger AI moves';
    end if;
  else
    select seat_no into v_my_seat
    from public.room_members
    where room_id = v_room_id and uid = auth.uid();

    if v_my_seat is null or v_my_seat <> v_current_seat then
      raise exception 'not_your_turn: You are Seat %, Current is Seat %', v_my_seat, v_current_seat;
    end if;
  end if;

  -- 5. Execute Move (Insert Turn)
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
  values (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  -- 6. Update Hand & Check Finish (Only if type is 'play')
  if p_payload->>'type' = 'play' then
    -- Fetch current hand
    select hand into v_hand
    from public.game_hands
    where game_id = p_game_id and seat_no = v_current_seat;

    -- Calculate new hand (Remove played cards)
    with played_cards as (
      select jsonb_array_elements(p_payload->'cards') as card
    )
    update public.game_hands
    set hand = (
      select jsonb_agg(h)
      from jsonb_array_elements(hand) h
      where not exists (
        select 1 from played_cards p 
        where (p.card->>'id')::int = (h->>'id')::int
      )
    )
    where game_id = p_game_id and seat_no = v_current_seat
    returning hand into v_hand;

    -- Check if hand is empty
    if jsonb_array_length(coalesce(v_hand, '[]'::jsonb)) = 0 then
      -- Player Finished!
      if not (v_rankings @> to_jsonb(v_current_seat)) then
        v_rankings := v_rankings || to_jsonb(v_current_seat);
      end if;
    end if;
  end if;

  -- 7. Update Counts (for UI)
  select array_agg(cnt) into v_new_counts
  from (
    select 
      case 
        when seat_no = v_current_seat then 
           (select jsonb_array_length(hand) from public.game_hands where game_id = p_game_id and seat_no = v_current_seat)
        else (v_counts->seat_no)::int
      end as cnt
    from generate_series(0, 3) as seat_no
  ) t;

  -- 8. Calculate Next Seat (Skip finished players)
  v_next_seat := v_current_seat;
  v_loop_count := 0;
  
  loop
    -- Move to next physical seat (CCW: 0->1->2->3)
    v_next_seat := (v_next_seat + 1) % 4;
    v_loop_count := v_loop_count + 1;

    -- Safety break
    if v_loop_count > 4 then
      exit; 
    end if;

    -- Check if v_next_seat is in rankings (finished)
    if not (v_rankings @> to_jsonb(v_next_seat)) then
      exit;
    end if;
  end loop;

  -- 9. Check Game Over Condition
  if jsonb_array_length(v_rankings) >= 3 then
    v_status := 'finished';
    -- Add the last player to rankings if not present
    for i in 0..3 loop
      if not (v_rankings @> to_jsonb(i)) then
        v_rankings := v_rankings || to_jsonb(i);
      end if;
    end loop;

    -- Set Room Status back to 'open' to allow new game
    update public.rooms set status = 'open' where id = v_room_id;
  end if;

  -- 10. Update Game State
  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = v_next_seat,
        status = v_status,
        state_public = jsonb_build_object(
          'counts', to_jsonb(v_new_counts),
          'rankings', v_rankings
        ),
        updated_at = now()
  where id = p_game_id;

  return query select v_turn_no + 1, v_next_seat, v_status, v_rankings;
end;
$$;
