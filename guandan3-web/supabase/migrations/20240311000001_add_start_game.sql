-- 20240311000001_add_start_game.sql

-- 1. Modify game_hands to support AI (use seat_no instead of uid)
drop table if exists public.game_hands cascade;

create table public.game_hands (
  game_id uuid not null references public.games(id) on delete cascade,
  seat_no int not null check (seat_no between 0 and 3),
  hand jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (game_id, seat_no)
);

alter table public.game_hands enable row level security;

-- Policy: Allow reading own hand (if human)
create policy "hands_select_self_seat" on public.game_hands
  for select using (
    exists (
      select 1
      from public.games g
      join public.room_members m on m.room_id = g.room_id
      where g.id = game_hands.game_id
      and m.seat_no = game_hands.seat_no
      and m.uid = auth.uid()
    )
  );

-- 2. RPC: Start Game
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
  v_jokers jsonb[] := array[
    jsonb_build_object('suit', 'J', 'rank', 'sb', 'val', 20),
    jsonb_build_object('suit', 'J', 'rank', 'hr', 'val', 30)
  ];
begin
  -- Check if room exists and is open
  if not exists (select 1 from public.rooms where id = p_room_id and status = 'open') then
    raise exception 'Room not ready';
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
    (extract(epoch from now()) * 1000)::bigint, 
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
