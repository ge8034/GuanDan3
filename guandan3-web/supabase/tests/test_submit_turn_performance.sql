-- test_submit_turn_performance.sql
-- Performance test for submit_turn RPC function
-- Run this in Supabase SQL Editor to measure query performance

-- Enable timing
\timing on

-- 1. Test basic submit_turn performance
do $$
declare
  v_room_id uuid;
  v_game_id uuid;
  v_user_id uuid;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_duration_ms numeric;
  i int;
begin
  -- Get a test user
  select id into v_user_id from auth.users limit 1;
  
  if v_user_id is null then
    raise notice 'No users found. Please create a test user first.';
    return;
  end if;
  
  raise notice 'Starting submit_turn performance test...';
  
  -- Create test room
  insert into public.rooms(owner_uid, mode, visibility, status)
  values (v_user_id, 'pve1v3', 'private', 'open')
  returning id into v_room_id;
  
  -- Add members
  insert into public.room_members(room_id, member_type, uid, ai_key, seat_no, ready)
  values
    (v_room_id, 'human', v_user_id, null, 0, true),
    (v_room_id, 'ai', null, 'bot_easy_1', 1, true),
    (v_room_id, 'ai', null, 'bot_easy_2', 2, true),
    (v_room_id, 'ai', null, 'bot_easy_3', 3, true);
  
  -- Create game
  insert into public.games(room_id, seed, status, turn_no, current_seat, state_public)
  values (v_room_id, 12345, 'playing', 1, 0, '{"counts": [1, 27, 27, 27], "rankings": []}'::jsonb)
  returning id into v_game_id;
  
  -- Test 100 consecutive submit_turn calls
  v_start_time := clock_timestamp();
  
  for i in 1..100 loop
    perform public.submit_turn(
      v_game_id,
      gen_random_uuid(),
      i,
      '{"type": "play", "cards": []}'::jsonb
    );
  end loop;
  
  v_end_time := clock_timestamp();
  v_duration_ms := extract(epoch from (v_end_time - v_start_time)) * 1000;
  
  raise notice '100 submit_turn calls completed in % ms (avg: % ms per call)', 
    v_duration_ms, v_duration_ms / 100;
  
  -- Check if performance meets target (P99 < 100ms)
  if v_duration_ms / 100 < 100 then
    raise notice '✓ Performance target met: Average < 100ms';
  else
    raise notice '✗ Performance target not met: Average >= 100ms';
  end if;
  
  -- Cleanup
  delete from public.turns where game_id = v_game_id;
  delete from public.games where id = v_game_id;
  delete from public.room_members where room_id = v_room_id;
  delete from public.rooms where id = v_room_id;
  
  raise notice 'Test completed and cleaned up.';
end;
$$;

-- 2. Test concurrent submit_turn performance (simulate 4 players)
do $$
declare
  v_room_id uuid;
  v_game_id uuid;
  v_user_id uuid;
  v_start_time timestamptz;
  v_end_time timestamptz;
  v_duration_ms numeric;
  i int;
begin
  -- Get a test user
  select id into v_user_id from auth.users limit 1;
  
  if v_user_id is null then
    raise notice 'No users found. Please create a test user first.';
    return;
  end if;
  
  raise notice 'Starting concurrent submit_turn performance test...';
  
  -- Create test room
  insert into public.rooms(owner_uid, mode, visibility, status)
  values (v_user_id, 'pvp4', 'private', 'open')
  returning id into v_room_id;
  
  -- Add 4 human members
  insert into public.room_members(room_id, member_type, uid, seat_no, ready)
  values
    (v_room_id, 'human', v_user_id, 0, true),
    (v_room_id, 'human', v_user_id, 1, true),
    (v_room_id, 'human', v_user_id, 2, true),
    (v_room_id, 'human', v_user_id, 3, true);
  
  -- Create game
  insert into public.games(room_id, seed, status, turn_no, current_seat, state_public)
  values (v_room_id, 12345, 'playing', 1, 0, '{"counts": [1, 27, 27, 27], "rankings": []}'::jsonb)
  returning id into v_game_id;
  
  -- Test 100 turns (25 per player)
  v_start_time := clock_timestamp();
  
  for i in 1..100 loop
    perform public.submit_turn(
      v_game_id,
      gen_random_uuid(),
      i,
      '{"type": "play", "cards": []}'::jsonb
    );
  end loop;
  
  v_end_time := clock_timestamp();
  v_duration_ms := extract(epoch from (v_end_time - v_start_time)) * 1000;
  
  raise notice '100 concurrent submit_turn calls completed in % ms (avg: % ms per call)', 
    v_duration_ms, v_duration_ms / 100;
  
  -- Check if performance meets target
  if v_duration_ms / 100 < 100 then
    raise notice '✓ Performance target met: Average < 100ms';
  else
    raise notice '✗ Performance target not met: Average >= 100ms';
  end if;
  
  -- Cleanup
  delete from public.turns where game_id = v_game_id;
  delete from public.games where id = v_game_id;
  delete from public.room_members where room_id = v_room_id;
  delete from public.rooms where id = v_room_id;
  
  raise notice 'Test completed and cleaned up.';
end;
$$;

-- 3. Check index usage
explain analyze
select g.room_id, g.current_seat, g.turn_no
from public.games g
where g.id = '00000000-0000-0000-0000-000000000000'::uuid;

explain analyze
select member_type, uid, seat_no
from public.room_members
where room_id = '00000000-0000-0000-0000-000000000000'::uuid and seat_no = 0;

explain analyze
select seat_no
from public.room_members
where room_id = '00000000-0000-0000-0000-000000000000'::uuid and uid = '00000000-0000-0000-0000-000000000000'::uuid;

-- Disable timing
\timing off
