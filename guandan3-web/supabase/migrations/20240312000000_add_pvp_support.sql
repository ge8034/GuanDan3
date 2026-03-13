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
