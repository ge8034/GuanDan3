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
