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
