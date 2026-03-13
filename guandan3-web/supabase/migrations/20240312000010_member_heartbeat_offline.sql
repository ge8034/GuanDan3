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
