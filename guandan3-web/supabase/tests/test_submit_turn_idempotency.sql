-- test_submit_turn_idempotency.sql
-- Test submit_turn RPC idempotency and sequential control
-- Run this in Supabase SQL Editor to verify turn_no + action_id control

do $$
declare
  v_room_id uuid;
  v_game_id uuid;
  v_user_id uuid;
  v_action_id uuid;
  v_turn_no int;
  v_current_seat int;
  v_turn_count int;
begin
  -- Get a test user
  select id into v_user_id from auth.users limit 1;
  
  if v_user_id is null then
    raise notice 'No users found. Please create a test user first.';
    return;
  end if;
  
  raise notice '=== Testing submit_turn Idempotency and Sequential Control ===';
  
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
  
  raise notice 'Test 1: Sequential Control - turn_no validation';
  raise notice '------------------------------------------------';
  
  -- Test 1.1: Submit turn with correct turn_no (should succeed)
  v_action_id := gen_random_uuid();
  select turn_no, current_seat into v_turn_no, v_current_seat
  from public.submit_turn(v_game_id, v_action_id, 1, '{"type": "play", "cards": []}'::jsonb);
  raise notice '✓ Turn 1 submitted successfully. New turn_no: %, current_seat: %', v_turn_no, v_current_seat;
  
  -- Test 1.2: Submit turn with wrong turn_no (should fail)
  begin
    perform public.submit_turn(v_game_id, gen_random_uuid(), 1, '{"type": "play", "cards": []}'::jsonb);
    raise exception 'Test Failed: Should have rejected turn_no=1 (current is 2)';
  exception when others then
    if SQLERRM like '%turn_no_mismatch%' then
      raise notice '✓ Correctly rejected turn_no=1 (expected 2): %', SQLERRM;
    else
      raise exception 'Unexpected error: %', SQLERRM;
    end if;
  end;
  
  -- Test 1.3: Submit turn with correct turn_no (should succeed)
  v_action_id := gen_random_uuid();
  select turn_no, current_seat into v_turn_no, v_current_seat
  from public.submit_turn(v_game_id, v_action_id, 2, '{"type": "play", "cards": []}'::jsonb);
  raise notice '✓ Turn 2 submitted successfully. New turn_no: %, current_seat: %', v_turn_no, v_current_seat;
  
  raise notice '';
  raise notice 'Test 2: Idempotency - action_id uniqueness';
  raise notice '--------------------------------------------';
  
  -- Test 2.1: Submit turn with same action_id (should fail due to unique constraint)
  begin
    perform public.submit_turn(v_game_id, v_action_id, 3, '{"type": "play", "cards": []}'::jsonb);
    raise exception 'Test Failed: Should have rejected duplicate action_id';
  exception when others then
    if SQLERRM like '%duplicate key%' or SQLERRM like '%unique constraint%' then
      raise notice '✓ Correctly rejected duplicate action_id: %', SQLERRM;
    else
      raise exception 'Unexpected error: %', SQLERRM;
    end if;
  end;
  
  -- Test 2.2: Submit turn with new action_id (should succeed)
  v_action_id := gen_random_uuid();
  select turn_no, current_seat into v_turn_no, v_current_seat
  from public.submit_turn(v_game_id, v_action_id, 3, '{"type": "play", "cards": []}'::jsonb);
  raise notice '✓ Turn 3 submitted successfully with new action_id. New turn_no: %, current_seat: %', v_turn_no, v_current_seat;
  
  raise notice '';
  raise notice 'Test 3: Concurrent Turn Submission (Race Condition)';
  raise notice '---------------------------------------------------';
  
  -- Test 3.1: Simulate concurrent submissions by checking turn_no validation
  -- In a real scenario, multiple clients might submit the same turn_no
  -- The first one succeeds, subsequent ones fail with turn_no_mismatch
  
  -- Submit turn 4
  select turn_no, current_seat into v_turn_no, v_current_seat
  from public.submit_turn(v_game_id, gen_random_uuid(), 4, '{"type": "play", "cards": []}'::jsonb);
  raise notice '✓ Turn 4 submitted successfully. New turn_no: %, current_seat: %', v_turn_no, v_current_seat;
  
  -- Try to submit turn 4 again (should fail)
  begin
    perform public.submit_turn(v_game_id, gen_random_uuid(), 4, '{"type": "play", "cards": []}'::jsonb);
    raise exception 'Test Failed: Should have rejected turn_no=4 (current is 5)';
  exception when others then
    if SQLERRM like '%turn_no_mismatch%' then
      raise notice '✓ Correctly rejected duplicate turn_no=4 (expected 5): %', SQLERRM;
    else
      raise exception 'Unexpected error: %', SQLERRM;
    end if;
  end;
  
  raise notice '';
  raise notice 'Test 4: Verify Turn History Integrity';
  raise notice '-------------------------------------';
  
  -- Check that all turns are recorded in order
  select count(*) into v_turn_count
  from public.turns
  where game_id = v_game_id;
  
  raise notice 'Total turns recorded: %', v_turn_count;
  
  -- Verify turn sequence
  if v_turn_count = 4 then
    raise notice '✓ Turn count matches expected (4)';
  else
    raise exception '✗ Turn count mismatch: expected 4, got %', v_turn_count;
  end if;
  
  -- Verify turn_no sequence
  if exists (
    select 1 from (
      select turn_no, lead(turn_no) over (order by turn_no) as next_turn_no
      from public.turns
      where game_id = v_game_id
    ) t
    where next_turn_no is not null and next_turn_no <> turn_no + 1
  ) then
    raise exception '✗ Turn sequence is broken';
  else
    raise notice '✓ Turn sequence is correct (consecutive)';
  end if;
  
  -- Verify action_id uniqueness
  if exists (
    select action_id, count(*)
    from public.turns
    where game_id = v_game_id
    group by action_id
    having count(*) > 1
  ) then
    raise exception '✗ Duplicate action_id found';
  else
    raise notice '✓ All action_id values are unique';
  end if;
  
  raise notice '';
  raise notice '=== All Tests Passed ===';
  
  -- Cleanup
  delete from public.turns where game_id = v_game_id;
  delete from public.games where id = v_game_id;
  delete from public.room_members where room_id = v_room_id;
  delete from public.rooms where id = v_room_id;
  
  raise notice 'Test completed and cleaned up.';
end;
$$;
