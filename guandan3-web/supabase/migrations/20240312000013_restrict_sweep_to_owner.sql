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

