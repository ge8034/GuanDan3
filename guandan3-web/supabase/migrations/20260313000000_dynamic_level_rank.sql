-- 20260313000000_dynamic_level_rank.sql
-- Make levelRank advance per finished game in the same room (2..14 cycle)

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
  v_card jsonb;
  v_i int;
  v_suit text;
  v_rank text;
  v_val int;
  v_suits text[] := array['H', 'D', 'C', 'S'];
  v_ranks text[] := array['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
begin
  select status, mode, type, owner_uid
    into v_room_status, v_room_mode, v_room_type, v_owner_uid
  from public.rooms
  where id = p_room_id
  for update;

  if v_room_status is null then
    raise exception 'Room not found';
  end if;

  if v_owner_uid <> auth.uid() then
    raise exception 'Only the room owner can start a game';
  end if;

  if v_room_status <> 'open' then
    raise exception 'Room is not open (Status: %)', v_room_status;
  end if;

  if exists (
    select 1 from public.games
    where room_id = p_room_id and status = 'playing'
  ) then
    raise exception 'A game is already playing in this room';
  end if;

  v_is_rematch := exists (
    select 1 from public.games
    where room_id = p_room_id and status = 'finished'
  );

  if v_room_mode = 'pvp4' then
    select count(*), count(*) filter (where ready = true)
      into v_member_count, v_ready_count
    from public.room_members
    where room_id = p_room_id;

    if v_member_count < 4 then
      raise exception 'Need 4 players to start (Current: %)', v_member_count;
    end if;

    if not v_is_rematch and v_ready_count < 4 then
      raise exception 'Not all players are ready (%/4)', v_ready_count;
    end if;
  end if;

  select count(*)
    into v_finished_count
  from public.games
  where room_id = p_room_id and status = 'finished';

  v_level_rank := 2 + (v_finished_count % 13);

  for d in 0..1 loop
    foreach v_suit in array v_suits loop
      for r in 1..13 loop
        v_rank := v_ranks[r];
        v_val := r + 1;
        v_card := jsonb_build_object(
          'suit', v_suit,
          'rank', v_rank,
          'val', v_val,
          'id', (d * 54) + ((case when v_suit='H' then 0 when v_suit='D' then 13 when v_suit='C' then 26 else 39 end) + r)
        );
        v_deck := array_append(v_deck, v_card);
      end loop;
    end loop;
    v_deck := array_append(v_deck, jsonb_build_object('suit', 'J', 'rank', 'sb', 'val', 20, 'id', (d*54)+53));
    v_deck := array_append(v_deck, jsonb_build_object('suit', 'J', 'rank', 'hr', 'val', 30, 'id', (d*54)+54));
  end loop;

  select array_agg(x order by gen_random_uuid())
    into v_shuffled_deck
  from unnest(v_deck) as x;

  for v_i in 1..108 loop
    v_hands[(v_i - 1) % 4 + 1] := v_hands[(v_i - 1) % 4 + 1] || v_shuffled_deck[v_i];
  end loop;

  insert into public.games (room_id, seed, status, turn_no, current_seat, state_public)
  values (
    p_room_id,
    (floor(random() * 9000000000) + 1000000000)::bigint,
    'playing',
    0,
    0,
    jsonb_build_object('counts', array[27, 27, 27, 27], 'rankings', '[]'::jsonb, 'levelRank', v_level_rank)
  )
  returning id into v_game_id;

  insert into public.game_hands (game_id, seat_no, hand)
  values
    (v_game_id, 0, v_hands[1]),
    (v_game_id, 1, v_hands[2]),
    (v_game_id, 2, v_hands[3]),
    (v_game_id, 3, v_hands[4]);

  update public.room_members
    set ready = false,
        last_seen_at = now()
  where room_id = p_room_id;

  update public.rooms set status = 'playing' where id = p_room_id;
end;
$$;

