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

