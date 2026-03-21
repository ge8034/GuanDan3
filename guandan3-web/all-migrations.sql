-- =========================================
-- Guandan3 Database Migrations
-- =========================================
-- Total migrations: 24
-- Generated: 2026-03-14T15:41:43.543Z
-- =========================================

-- =========================================
-- Migration 1/24: 20240311000000_init_schema.sql
-- =========================================

-- Migration script for GuanDan3 (Force Rebuild)
-- Run this in Supabase SQL Editor
-- This will DROP existing tables and recreate them to ensure schema consistency

-- 1. Reset Schema (Drop tables in correct order to avoid FK errors)
drop table if exists public.scores cascade;
drop table if exists public.turns cascade;
drop table if exists public.game_hands cascade;
drop table if exists public.games cascade;
drop table if exists public.room_members cascade;
drop table if exists public.rooms cascade;
drop table if exists public.profiles cascade;

-- 2. Reset Permissions
revoke all on schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- 3. Create Tables

-- 3.1 Profiles
create table public.profiles (
  uid uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default '玩家',
  avatar_url text,
  created_at timestamptz not null default now()
);

-- 3.2 Rooms
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  owner_uid uuid not null references auth.users(id) on delete cascade,
  mode text not null default 'pvp4' check (mode in ('pvp4', 'pve1v3')),
  status text not null default 'open',
  visibility text not null default 'public',
  created_at timestamptz not null default now()
);

-- 3.3 Room Members
create table public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  member_type text not null default 'human' check (member_type in ('human', 'ai')),
  uid uuid references auth.users(id) on delete cascade,
  ai_key text,
  seat_no int not null check (seat_no between 0 and 3),
  ready boolean not null default false,
  last_seen_at timestamptz not null default now(),
  unique(room_id, seat_no)
);

create unique index room_members_room_uid_uq
  on public.room_members(room_id, uid)
  where uid is not null;

create unique index room_members_room_ai_key_uq
  on public.room_members(room_id, ai_key)
  where ai_key is not null;

-- 3.4 Games
create table public.games (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  seed bigint not null,
  status text not null default 'deal',
  turn_no int not null default 0,
  current_seat int not null default 0,
  state_public jsonb not null default '{}'::jsonb,
  state_private jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.5 Game Hands
create table public.game_hands (
  game_id uuid not null references public.games(id) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade,
  hand jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (game_id, uid)
);

-- 3.6 Turns
create table public.turns (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  turn_no int not null,
  seat_no int not null check (seat_no between 0 and 3),
  action_id uuid not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create unique index turns_game_turn_no_uq on public.turns(game_id, turn_no);
create unique index turns_game_action_id_uq on public.turns(game_id, action_id);

-- 3.7 Scores
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  uid uuid not null references auth.users(id) on delete cascade,
  delta int not null,
  total_after int not null,
  created_at timestamptz not null default now()
);

-- 4. Enable RLS
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.games enable row level security;
alter table public.game_hands enable row level security;
alter table public.turns enable row level security;
alter table public.scores enable row level security;

-- 5. Create Policies (After all tables exist)

-- 5.1 Profiles Policies
create policy "profiles_select_self" on public.profiles
  for select using (auth.uid() = uid);

create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = uid);

create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = uid) with check (auth.uid() = uid);

-- 5.2 Rooms Policies
create policy "rooms_select_by_member_or_public" on public.rooms
  for select using (
    visibility = 'public'
    or exists (
      select 1 from public.room_members m
      where m.room_id = rooms.id and m.uid = auth.uid()
    )
  );

create policy "rooms_insert_owner" on public.rooms
  for insert with check (auth.uid() = owner_uid);

create policy "rooms_update_owner" on public.rooms
  for update using (auth.uid() = owner_uid) with check (auth.uid() = owner_uid);

-- 5.3 Room Members Policies
create policy "members_select_self_room" on public.room_members
  for select using (
    exists (select 1 from public.room_members m
            where m.room_id = room_members.room_id and m.uid = auth.uid())
  );

-- 5.4 Games Policies
create policy "games_select_by_member" on public.games
  for select using (
    exists (select 1 from public.room_members m
            where m.room_id = games.room_id and m.uid = auth.uid())
  );

-- 5.5 Game Hands Policies
create policy "hands_select_self" on public.game_hands
  for select using (
    uid = auth.uid()
    and exists (
      select 1
      from public.games g
      join public.room_members m on m.room_id = g.room_id
      where g.id = game_hands.game_id and m.uid = auth.uid()
    )
  );

-- 5.6 Turns Policies
create policy "turns_select_by_member" on public.turns
  for select using (
    exists (
      select 1 from public.games g
      join public.room_members m on m.room_id = g.room_id
      where g.id = turns.game_id and m.uid = auth.uid()
    )
  );

-- 5.7 Scores Policies
create policy "scores_select_by_member" on public.scores
  for select using (
    exists (
      select 1 from public.games g
      join public.room_members m on m.room_id = g.room_id
      where g.id = scores.game_id and m.uid = auth.uid()
    )
  );

-- 6. Grant Permissions
revoke all on table public.rooms from anon, authenticated;
revoke all on table public.room_members from anon, authenticated;
revoke all on table public.games from anon, authenticated;
revoke all on table public.game_hands from anon, authenticated;
revoke all on table public.turns from anon, authenticated;
revoke all on table public.scores from anon, authenticated;

grant select, insert, update on table public.profiles to authenticated;
grant select on table public.rooms to authenticated;
grant select on table public.room_members to authenticated;
grant select on table public.games to authenticated;
grant select on table public.game_hands to authenticated;
grant select on table public.turns to authenticated;
grant select on table public.scores to authenticated;

revoke select (state_private) on table public.games from authenticated;
revoke select (state_private) on table public.games from anon;

-- 7. Create RPC Functions

-- 7.1 Create Practice Room
create or replace function public.create_practice_room(
  p_visibility text default 'private'
)
returns table(room_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
begin
  -- Insert room
  insert into public.rooms(owner_uid, mode, visibility, status)
  values (auth.uid(), 'pve1v3', p_visibility, 'open')
  returning id into v_room_id;

  -- Insert members (Human + 3 AI)
  insert into public.room_members(room_id, member_type, uid, ai_key, seat_no, ready)
  values
    (v_room_id, 'human', auth.uid(), null, 0, true),
    (v_room_id, 'ai', null, 'bot_easy_1', 1, true),
    (v_room_id, 'ai', null, 'bot_easy_2', 2, true),
    (v_room_id, 'ai', null, 'bot_easy_3', 3, true);

  return query select v_room_id;
end;
$$;

grant execute on function public.create_practice_room(text) to authenticated;

-- 7.2 Submit Turn
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
begin
  -- Lock game row
  select g.room_id, g.current_seat, g.turn_no
    into v_room_id, v_current_seat, v_turn_no
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


-- =========================================
-- Migration 2/24: 20240311000001_add_start_game.sql
-- =========================================

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


-- =========================================
-- Migration 3/24: 20240311000002_fix_rls.sql
-- =========================================

-- 20240311000002_fix_rls.sql
-- Fix infinite recursion in RLS policies by using SECURITY DEFINER functions

-- 1. Create Helper Function to check room membership (bypassing RLS)
create or replace function public.fn_is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = p_room_id
    and uid = auth.uid()
  );
$$;

-- 2. Create Helper Function to check hand ownership (bypassing RLS)
create or replace function public.fn_can_view_hand(p_game_id uuid, p_seat_no int)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.games g
    join public.room_members m on m.room_id = g.room_id
    where g.id = p_game_id
    and m.seat_no = p_seat_no
    and m.uid = auth.uid()
  );
$$;

-- 3. Update Policies

-- 3.1 Room Members
drop policy if exists "members_select_self_room" on public.room_members;
create policy "members_select_self_room" on public.room_members
  for select using (
    -- Use function to avoid recursion
    fn_is_room_member(room_id)
  );

-- 3.2 Rooms
drop policy if exists "rooms_select_by_member_or_public" on public.rooms;
create policy "rooms_select_by_member_or_public" on public.rooms
  for select using (
    visibility = 'public'
    or fn_is_room_member(id)
  );

-- 3.3 Games
drop policy if exists "games_select_by_member" on public.games;
create policy "games_select_by_member" on public.games
  for select using (
    fn_is_room_member(room_id)
  );

-- 3.4 Game Hands
drop policy if exists "hands_select_self" on public.game_hands;
drop policy if exists "hands_select_self_seat" on public.game_hands;

create policy "hands_select_self_seat" on public.game_hands
  for select using (
    fn_can_view_hand(game_id, seat_no)
  );

-- 3.5 Turns
drop policy if exists "turns_select_by_member" on public.turns;
create policy "turns_select_by_member" on public.turns
  for select using (
    fn_is_room_member((select room_id from public.games where id = turns.game_id))
  );

-- 3.6 Scores
drop policy if exists "scores_select_by_member" on public.scores;
create policy "scores_select_by_member" on public.scores
  for select using (
    fn_is_room_member((select room_id from public.games where id = scores.game_id))
  );


-- =========================================
-- Migration 4/24: 20240311000003_allow_ai_moves.sql
-- =========================================

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


-- =========================================
-- Migration 5/24: 20240311000004_fix_submit_turn_debug.sql
-- =========================================

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


-- =========================================
-- Migration 6/24: 20240311000005_get_ai_hand.sql
-- =========================================

-- 20240311000005_get_ai_hand.sql
-- RPC to fetch AI hands for client-side AI logic

create or replace function public.get_ai_hand(
  p_game_id uuid,
  p_seat_no int
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
  v_hand jsonb;
begin
  -- 1. Get Room ID
  select room_id into v_room_id
  from public.games
  where id = p_game_id;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. Verify Caller is a Member of the Room (Basic security)
  if not exists (
    select 1 from public.room_members
    where room_id = v_room_id and uid = auth.uid()
  ) then
    raise exception 'Unauthorized';
  end if;

  -- 3. Fetch Hand
  select hand into v_hand
  from public.game_hands
  where game_id = p_game_id and seat_no = p_seat_no;

  return v_hand;
end;
$$;


-- =========================================
-- Migration 7/24: 20240311000007_game_finish_logic.sql
-- =========================================

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


-- =========================================
-- Migration 8/24: 20240311000008_enable_realtime.sql
-- =========================================

-- 20240311000008_enable_realtime.sql
-- Enable Realtime for games and turns tables

begin;

-- Check if publication exists (Supabase default is supabase_realtime)
-- We add tables to it.

-- Add games table if not already added (usually it is by default in Supabase UI, but good to be explicit)
alter publication supabase_realtime add table public.games;

-- Add turns table so we can listen to INSERTs
alter publication supabase_realtime add table public.turns;

commit;


-- =========================================
-- Migration 9/24: 20240312000000_add_pvp_support.sql
-- =========================================

-- 20240312000000_add_pvp_support.sql
-- Add support for PVP rooms (type, name) and create/join RPCs

begin;

-- 1. Add columns to rooms table
alter table public.rooms 
  add column if not exists type text not null default 'classic',
  add column if not exists name text;

-- 2. RPC: Create Room (PVP)
create or replace function public.create_room(
  p_name text,
  p_type text default 'classic',
  p_mode text default 'pvp4',
  p_visibility text default 'public'
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
begin
  -- Insert room
  insert into public.rooms(owner_uid, name, mode, type, visibility, status)
  values (auth.uid(), p_name, p_mode, p_type, p_visibility, 'open')
  returning id into v_room_id;

  -- Insert owner as member (Seat 0)
  insert into public.room_members(room_id, member_type, uid, seat_no, ready)
  values (v_room_id, 'human', auth.uid(), 0, true);

  return v_room_id;
end;
$$;

-- 3. RPC: Join Room
create or replace function public.join_room(
  p_room_id uuid,
  p_seat_no int default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_count int;
  v_target_seat int;
  v_room_status text;
begin
  -- Check room status
  select status into v_room_status from public.rooms where id = p_room_id;
  if v_room_status <> 'open' then
    raise exception 'Room is not open (Status: %)', v_room_status;
  end if;

  -- Check if already member
  if exists (select 1 from public.room_members where room_id = p_room_id and uid = auth.uid()) then
    return true; -- Already joined
  end if;

  -- Determine seat
  if p_seat_no is not null then
    -- Check if seat is taken
    if exists (select 1 from public.room_members where room_id = p_room_id and seat_no = p_seat_no) then
      raise exception 'Seat % is already taken', p_seat_no;
    end if;
    v_target_seat := p_seat_no;
  else
    -- Find first empty seat (0-3)
    select s.seat
    into v_target_seat
    from generate_series(0, 3) s(seat)
    where not exists (
      select 1 from public.room_members m 
      where m.room_id = p_room_id and m.seat_no = s.seat
    )
    limit 1;
    
    if v_target_seat is null then
      raise exception 'Room is full';
    end if;
  end if;

  -- Insert member
  insert into public.room_members(room_id, member_type, uid, seat_no, ready)
  values (p_room_id, 'human', auth.uid(), v_target_seat, false);

  return true;
end;
$$;

-- 4. Grant permissions
grant execute on function public.create_room(text, text, text, text) to authenticated;
grant execute on function public.join_room(uuid, int) to authenticated;

-- 5. RLS: Allow viewing members of public rooms (for Lobby player counts)
create policy "members_select_public_room" on public.room_members
  for select using (
    exists (
      select 1 from public.rooms r 
      where r.id = room_members.room_id 
      and r.visibility = 'public'
    )
  );

commit;


-- =========================================
-- Migration 10/24: 20240312000001_add_ready_logic.sql
-- =========================================

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


-- =========================================
-- Migration 11/24: 20240312000002_add_leave_room.sql
-- =========================================

-- 20240312000002_add_leave_room.sql
-- Add leave_room RPC

begin;

create or replace function public.leave_room(
  p_room_id uuid
)
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_status text;
  v_owner_uid uuid;
  v_member_count int;
begin
  -- Check room status
  select status, owner_uid into v_room_status, v_owner_uid 
  from public.rooms 
  where id = p_room_id;

  if v_room_status = 'playing' then
    raise exception 'Cannot leave room while game is playing';
  end if;

  -- Remove member
  delete from public.room_members
  where room_id = p_room_id and uid = auth.uid();

  if not found then
    raise exception 'Not a member of this room';
  end if;

  -- Check remaining members
  select count(*) into v_member_count 
  from public.room_members 
  where room_id = p_room_id;

  -- If room is empty, delete it
  if v_member_count = 0 then
    delete from public.rooms where id = p_room_id;
  elsif auth.uid() = v_owner_uid then
    -- If owner left, assign new owner (randomly pick one)
    update public.rooms
    set owner_uid = (
      select uid from public.room_members 
      where room_id = p_room_id 
      order by created_at asc 
      limit 1
    )
    where id = p_room_id;
  end if;
end;
$$;

grant execute on function public.leave_room(uuid) to authenticated;

commit;


-- =========================================
-- Migration 12/24: 20240312000003_fix_start_game_seed.sql
-- =========================================

-- 20240312000003_fix_start_game_seed.sql
-- Fix the start_game function to include the missing 'seed' value in INSERT statement

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

  -- Create Game (Fixed: Added seed value)
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


-- =========================================
-- Migration 13/24: 20240312000004_enable_realtime_pvp.sql
-- =========================================

-- 20240312000004_enable_realtime_pvp.sql
-- Add rooms and room_members to supabase_realtime publication

begin;

-- Check if tables exist first (sanity check)
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'rooms') then
    alter publication supabase_realtime add table public.rooms;
  end if;

  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'room_members') then
    alter publication supabase_realtime add table public.room_members;
  end if;
end;
$$;

commit;


-- =========================================
-- Migration 14/24: 20240312000005_test_helper_endgame.sql
-- =========================================

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


-- =========================================
-- Migration 15/24: 20240312000006_fix_empty_hand_null_bug.sql
-- =========================================

-- 20240312000006_fix_empty_hand_null_bug.sql
-- Fix bug where empty hands become NULL instead of empty array []

-- Drop and recreate submit_turn function with null handling fix
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

    -- Calculate new hand (Remove played cards) - FIX: Use COALESCE to ensure [] instead of NULL
    with played_cards as (
      select jsonb_array_elements(p_payload->'cards') as card
    )
    update public.game_hands
    set hand = coalesce((
      select jsonb_agg(h)
      from jsonb_array_elements(hand) h
      where not exists (
        select 1 from played_cards p
        where (p.card->>'id')::int = (h->>'id')::int
      )
    ), '[]'::jsonb)  -- 🔧 FIX: Ensure empty array instead of NULL
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

  -- 7. Update Counts (for UI) - FIX: Handle NULL hand values properly
  select array_agg(cnt) into v_new_counts
  from (
    select
      case
        when seat_no = v_current_seat then
           (select jsonb_array_length(coalesce(hand, '[]'::jsonb)) from public.game_hands where game_id = p_game_id and seat_no = v_current_seat)
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

-- =========================================
-- Migration 16/24: 20240312000007_fix_endgame_turn_no.sql
-- =========================================

-- 20240312000007_fix_endgame_turn_no.sql
-- Fix setup_test_endgame to properly update turn_no for state sync

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

  -- Update game state with turn_no increment for proper state sync
  update public.games
  set state_public = jsonb_build_object(
    'counts', array[1, 1, 1, 1],
    'rankings', '[]'::jsonb
  ),
  current_seat = 0,
  turn_no = turn_no + 1, -- 🔧 FIX: Force state refresh for frontend
  updated_at = now()     -- 🔧 FIX: Trigger subscription update
  where id = v_game_id;

end;
$$;

-- =========================================
-- Migration 17/24: 20240312000008_start_game_rematch_guard.sql
-- =========================================

-- 20240312000008_start_game_rematch_guard.sql
-- Update start_game to support safe rematch and prevent double-playing games

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
    jsonb_build_object('counts', array[27, 27, 27, 27], 'rankings', '[]'::jsonb, 'levelRank', 2)
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


-- =========================================
-- Migration 18/24: 20240312000009_fix_join_room_reconnect.sql
-- =========================================

-- 20240312000009_fix_join_room_reconnect.sql
-- Allow reconnect by returning early when user is already a room member

create or replace function public.join_room(
  p_room_id uuid,
  p_seat_no int default null
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_target_seat int;
  v_room_status text;
begin
  if exists (
    select 1 from public.room_members
    where room_id = p_room_id and uid = auth.uid()
  ) then
    update public.room_members
      set last_seen_at = now()
    where room_id = p_room_id and uid = auth.uid();
    return true;
  end if;

  select status into v_room_status from public.rooms where id = p_room_id;
  if v_room_status is null then
    raise exception 'Room not found';
  end if;
  if v_room_status <> 'open' then
    raise exception 'Room is not open (Status: %)', v_room_status;
  end if;

  if p_seat_no is not null then
    if exists (select 1 from public.room_members where room_id = p_room_id and seat_no = p_seat_no) then
      raise exception 'Seat % is already taken', p_seat_no;
    end if;
    v_target_seat := p_seat_no;
  else
    select s.seat
      into v_target_seat
    from generate_series(0, 3) s(seat)
    where not exists (
      select 1 from public.room_members m
      where m.room_id = p_room_id and m.seat_no = s.seat
    )
    limit 1;

    if v_target_seat is null then
      raise exception 'Room is full';
    end if;
  end if;

  insert into public.room_members(room_id, member_type, uid, seat_no, ready)
  values (p_room_id, 'human', auth.uid(), v_target_seat, false);

  return true;
end;
$$;



-- =========================================
-- Migration 19/24: 20240312000010_member_heartbeat_offline.sql
-- =========================================

alter table public.room_members
  add column if not exists online boolean not null default true;

create or replace function public.heartbeat_room_member(
  p_room_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  update public.room_members
    set last_seen_at = now(),
        online = true
  where room_id = p_room_id and uid = auth.uid();

  if not found then
    raise exception 'Not a member of this room';
  end if;

  return true;
end;
$$;

create or replace function public.sweep_offline_members(
  p_room_id uuid,
  p_timeout_seconds int default 15
)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_cutoff timestamptz;
  v_updated int;
begin
  if not exists (
    select 1 from public.room_members
    where room_id = p_room_id and uid = auth.uid()
  ) then
    raise exception 'Not a member of this room';
  end if;

  v_cutoff := now() - make_interval(secs => p_timeout_seconds);

  update public.room_members
    set online = false
  where room_id = p_room_id and last_seen_at < v_cutoff;

  get diagnostics v_updated = row_count;

  return v_updated;
end;
$$;

grant execute on function public.heartbeat_room_member(uuid) to authenticated;
grant execute on function public.sweep_offline_members(uuid, int) to authenticated;


-- =========================================
-- Migration 20/24: 20240312000011_get_turns_since.sql
-- =========================================

create or replace function public.get_turns_since(
  p_game_id uuid,
  p_from_turn_no int
)
returns table(turn_no int, seat_no int, payload jsonb)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
begin
  select room_id into v_room_id
  from public.games
  where id = p_game_id;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  if not public.fn_is_room_member(v_room_id) then
    raise exception 'Not a member of this room';
  end if;

  return query
  select t.turn_no, t.seat_no, t.payload
  from public.turns t
  where t.game_id = p_game_id
    and t.turn_no > p_from_turn_no
  order by t.turn_no asc;
end;
$$;

grant execute on function public.get_turns_since(uuid, int) to authenticated;



-- =========================================
-- Migration 21/24: 20240312000012_fix_offline_sweep_ai.sql
-- =========================================

create or replace function public.sweep_offline_members(
  p_room_id uuid,
  p_timeout_seconds int default 15
)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_cutoff timestamptz;
  v_updated int;
begin
  if not exists (
    select 1 from public.room_members
    where room_id = p_room_id and uid = auth.uid()
  ) then
    raise exception 'Not a member of this room';
  end if;

  v_cutoff := now() - make_interval(secs => p_timeout_seconds);

  update public.room_members
    set online = false
  where room_id = p_room_id
    and uid is not null
    and last_seen_at < v_cutoff;

  get diagnostics v_updated = row_count;

  return v_updated;
end;
$$;



-- =========================================
-- Migration 22/24: 20240312000013_restrict_sweep_to_owner.sql
-- =========================================

create or replace function public.sweep_offline_members(
  p_room_id uuid,
  p_timeout_seconds int default 15
)
returns int
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_cutoff timestamptz;
  v_updated int;
  v_owner_uid uuid;
begin
  select owner_uid into v_owner_uid
  from public.rooms
  where id = p_room_id;

  if v_owner_uid is null then
    raise exception 'Room not found';
  end if;

  if v_owner_uid <> auth.uid() then
    raise exception 'Only the room owner can sweep offline members';
  end if;

  v_cutoff := now() - make_interval(secs => p_timeout_seconds);

  update public.room_members
    set online = false
  where room_id = p_room_id
    and uid is not null
    and last_seen_at < v_cutoff;

  get diagnostics v_updated = row_count;

  return v_updated;
end;
$$;



-- =========================================
-- Migration 23/24: 20240314000001_optimize_submit_turn.sql
-- =========================================

-- 20240314000001_optimize_submit_turn.sql
-- Optimize submit_turn RPC performance by adding missing indexes

-- 1. Add index on games.room_id for faster room lookups
-- This improves the query: select g.room_id, g.current_seat, g.turn_no from public.games g where g.id = p_game_id
create index if not exists games_room_id_idx on public.games(room_id);

-- 2. Add composite index on room_members(room_id, seat_no) for faster current seat lookups
-- This improves the query: select member_type, uid, seat_no from public.room_members where room_id = v_room_id and seat_no = v_current_seat
create index if not exists room_members_room_seat_idx on public.room_members(room_id, seat_no);

-- 3. Add composite index on room_members(room_id, uid) for faster membership checks
-- This improves the query: select seat_no from public.room_members where room_id = v_room_id and uid = auth.uid()
-- Note: This complements the existing unique index room_members_room_uid_uq which is a partial index
create index if not exists room_members_room_uid_idx on public.room_members(room_id, uid) where uid is not null;

-- 4. Add index on turns.game_id for faster turn history queries
-- This improves queries like: select * from public.turns where game_id = p_game_id order by turn_no
create index if not exists turns_game_id_idx on public.turns(game_id);

-- 5. Add index on games.updated_at for cleanup queries
-- This helps with queries that filter by updated_at for cleanup or monitoring
create index if not exists games_updated_at_idx on public.games(updated_at);

-- 6. Add index on room_members.last_seen_at for timeout cleanup
-- This helps with queries that filter by last_seen_at for timeout handling
create index if not exists room_members_last_seen_at_idx on public.room_members(last_seen_at);

-- 7. Optimize submit_turn function to reduce redundant queries
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
  v_is_member boolean;
begin
  -- 1. Lock game and get state (single query with index on games.id)
  select g.room_id, g.current_seat, g.turn_no
    into v_room_id, v_current_seat, v_turn_no
  from public.games g
  where g.id = p_game_id
  for update;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. Validate Turn Number (early exit)
  if v_turn_no <> p_expected_turn_no then
    raise exception 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  end if;

  -- 3. Identify Actor and check membership in single query (uses room_members_room_seat_idx)
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

  -- 5. Authorize Action (uses room_members_room_uid_idx)
  if v_is_ai then
    -- Any member can trigger AI move
    select exists(
      select 1 from public.room_members 
      where room_id = v_room_id and uid = auth.uid()
    ) into v_is_member;
    
    if not v_is_member then
      raise exception 'Unauthorized: Only room members can trigger AI moves';
    end if;
  else
    -- Human turn check
    select seat_no into v_my_seat
    from public.room_members
    where room_id = v_room_id and uid = auth.uid();

    if v_my_seat is null or v_my_seat <> v_current_seat then
      raise exception 'not_your_turn: You are Seat %, Current is Seat % (Type: %, UID: %)', 
        v_my_seat, v_current_seat, v_member_type, v_member_uid;
    end if;
  end if;

  -- 6. Execute Move (uses turns_game_turn_no_uq for uniqueness)
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
  values (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  -- 7. Update game state (uses games_room_id_idx for FK constraint)
  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = (v_current_seat + 1) % 4,
        updated_at = now()
  where id = p_game_id;

  return query
    select v_turn_no + 1, (v_current_seat + 1) % 4;
end;
$$;

-- 8. Add comment for documentation
comment on index public.games_room_id_idx is 'Optimize room lookups in submit_turn and game queries';
comment on index public.room_members_room_seat_idx is 'Optimize current seat lookups in submit_turn';
comment on index public.room_members_room_uid_idx is 'Optimize membership checks in submit_turn';
comment on index public.turns_game_id_idx is 'Optimize turn history queries';
comment on index public.games_updated_at_idx is 'Optimize cleanup and monitoring queries';
comment on index public.room_members_last_seen_at_idx is 'Optimize timeout cleanup queries';


-- =========================================
-- Migration 24/24: 20260313000000_dynamic_level_rank.sql
-- =========================================

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



