-- 20240312000001_add_ready_logic.sql
-- Add 'ready' toggle RPC and update start_game to check ready status

begin;

-- 1. RPC: Toggle Ready
create or replace function public.toggle_ready(
  p_room_id uuid,
  p_ready boolean
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_status text;
begin
  -- Check room status
  select status into v_status from public.rooms where id = p_room_id;
  if v_status <> 'open' then
    raise exception 'Room is not open';
  end if;

  -- Update member status
  update public.room_members
  set ready = p_ready,
      last_seen_at = now()
  where room_id = p_room_id and uid = auth.uid();

  if not found then
    raise exception 'Not a member of this room';
  end if;

  return true;
end;
$$;

-- 2. Update Start Game to check readiness in PVP
create or replace function public.start_game(
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_game_id uuid;
  v_room_mode text;
  v_room_type text;
  v_member_count int;
  v_ready_count int;
  v_deck jsonb[] := array[]::jsonb[];
  v_shuffled_deck jsonb[];
  v_hands jsonb[] := array['[]'::jsonb, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb];
  v_card jsonb;
  v_i int;
  v_suit text;
  v_rank text;
  v_val int;
  v_suits text[] := array['H', 'D', 'C', 'S'];
  v_ranks text[] := array['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
begin
  -- Check room status and mode
  select status, mode, type into v_room_mode, v_room_mode, v_room_type 
  from public.rooms 
  where id = p_room_id 
  for update; -- Lock room to prevent race conditions

  if v_room_mode is null then
    raise exception 'Room not found';
  end if;

  -- Check readiness for PVP
  if v_room_mode = 'pvp4' then
    select count(*), count(*) filter (where ready = true)
    into v_member_count, v_ready_count
    from public.room_members
    where room_id = p_room_id;

    if v_member_count < 4 then
      raise exception 'Need 4 players to start (Current: %)', v_member_count;
    end if;

    if v_ready_count < 4 then
      raise exception 'Not all players are ready (%/4)', v_ready_count;
    end if;
  end if;

  -- Create Deck (2 decks)
  for d in 0..1 loop
    -- Suits
    foreach v_suit in array v_suits loop
      for r in 1..13 loop
        v_rank := v_ranks[r];
        v_val := r + 1; -- 2=2...A=14
        v_card := jsonb_build_object(
          'suit', v_suit,
          'rank', v_rank,
          'val', v_val,
          'id', (d * 54) + ((case when v_suit='H' then 0 when v_suit='D' then 13 when v_suit='C' then 26 else 39 end) + r)
        );
        v_deck := array_append(v_deck, v_card);
      end loop;
    end loop;
    -- Jokers
    v_deck := array_append(v_deck, jsonb_build_object('suit', 'J', 'rank', 'sb', 'val', 20, 'id', (d*54)+53));
    v_deck := array_append(v_deck, jsonb_build_object('suit', 'J', 'rank', 'hr', 'val', 30, 'id', (d*54)+54));
  end loop;

  -- Shuffle
  select array_agg(x order by gen_random_uuid())
  into v_shuffled_deck
  from unnest(v_deck) as x;

  -- Deal
  for v_i in 1..108 loop
    v_hands[(v_i - 1) % 4 + 1] := v_hands[(v_i - 1) % 4 + 1] || v_shuffled_deck[v_i];
  end loop;

  -- Create Game
  insert into public.games (room_id, seed, status, turn_no, current_seat, state_public)
  values (
    p_room_id, 
    (floor(random() * 9000000000) + 1000000000)::bigint, -- seed
    'playing', 
    0, 
    0,
    jsonb_build_object('counts', array[27, 27, 27, 27])
  )
  returning id into v_game_id;

  -- Insert Hands
  insert into public.game_hands (game_id, seat_no, hand)
  values
    (v_game_id, 0, v_hands[1]),
    (v_game_id, 1, v_hands[2]),
    (v_game_id, 2, v_hands[3]),
    (v_game_id, 3, v_hands[4]);

  -- Update Room Status
  update public.rooms set status = 'playing' where id = p_room_id;
end;
$$;

grant execute on function public.toggle_ready(uuid, boolean) to authenticated;

commit;
