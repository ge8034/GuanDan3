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
