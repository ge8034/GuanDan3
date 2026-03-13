-- 20240312000005_test_helper_endgame.sql
-- For testing only: Sets up an endgame scenario with 1 card per player

create or replace function public.setup_test_endgame(
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_game_id uuid;
begin
  select id into v_game_id from public.games where room_id = p_room_id and status = 'playing';
  
  if v_game_id is null then
    raise exception 'Game not found';
  end if;

  -- Seat 0: H 2 (val 2, id 0)
  update public.game_hands 
  set hand = '[{"id": 0, "val": 2, "rank": "2", "suit": "H"}]'::jsonb
  where game_id = v_game_id and seat_no = 0;

  -- Seat 1: H 3 (val 3, id 1)
  update public.game_hands 
  set hand = '[{"id": 1, "val": 3, "rank": "3", "suit": "H"}]'::jsonb
  where game_id = v_game_id and seat_no = 1;

  -- Seat 2: H 4 (val 4, id 2)
  update public.game_hands 
  set hand = '[{"id": 2, "val": 4, "rank": "4", "suit": "H"}]'::jsonb
  where game_id = v_game_id and seat_no = 2;

  -- Seat 3: H 5 (val 5, id 3)
  update public.game_hands 
  set hand = '[{"id": 3, "val": 5, "rank": "5", "suit": "H"}]'::jsonb
  where game_id = v_game_id and seat_no = 3;

  -- Update counts
  update public.games
  set state_public = jsonb_build_object(
    'counts', array[1, 1, 1, 1],
    'rankings', '[]'::jsonb
  ),
  current_seat = 0,
  turn_no = turn_no + 1 -- Force refresh
  where id = v_game_id;

end;
$$;
