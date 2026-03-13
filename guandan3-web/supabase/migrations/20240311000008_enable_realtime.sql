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
