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
