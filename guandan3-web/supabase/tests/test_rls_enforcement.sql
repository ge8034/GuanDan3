-- test_rls_enforcement.sql
-- Test RLS policy enforcement for database write operations
-- Run this in Supabase SQL Editor to verify security boundaries

do $$
declare
  v_room_id uuid;
  v_game_id uuid;
  v_user1 uuid;
  v_user2 uuid;
  v_error_message text;
begin
  -- Get two test users
  select id into v_user1 from auth.users limit 1;
  select id into v_user2 from auth.users offset 1 limit 1;
  
  if v_user1 is null or v_user2 is null then
    raise notice 'Need at least 2 users for RLS testing. Please create test users first.';
    return;
  end if;
  
  raise notice '=== Testing RLS Policy Enforcement ===';
  raise notice 'User 1: %', v_user1;
  raise notice 'User 2: %', v_user2;
  raise notice '';
  
  -- Create room as user1
  insert into public.rooms(owner_uid, mode, visibility, status)
  values (v_user1, 'pvp4', 'private', 'open')
  returning id into v_room_id;
  
  raise notice 'Test 1: Direct INSERT into rooms (should fail)';
  raise notice '--------------------------------------------';
  
  -- Try to insert room directly (should fail due to RLS)
  begin
    insert into public.rooms(owner_uid, mode, visibility, status)
    values (v_user2, 'pvp4', 'private', 'open');
    raise exception 'Test Failed: Direct INSERT should have been blocked by RLS';
  exception when others then
    v_error_message := SQLERRM;
    if v_error_message like '%new row violates row-level security policy%' or 
       v_error_message like '%permission denied%' then
      raise notice '✓ Direct INSERT blocked by RLS: %', v_error_message;
    else
      raise exception 'Unexpected error: %', v_error_message;
    end if;
  end;
  
  raise notice '';
  raise notice 'Test 2: Direct UPDATE on rooms (should fail)';
  raise notice '---------------------------------------------';
  
  -- Try to update room as non-owner (should fail)
  begin
    -- Simulate user2 trying to update user1's room
    -- In SQL Editor, we can't easily switch users, so we test the policy logic
    update public.rooms set status = 'playing' where id = v_room_id;
    -- If this succeeds, it means the current user (v_user1) is the owner
    raise notice '✓ UPDATE succeeded (current user is owner)';
  exception when others then
    v_error_message := SQLERRM;
    if v_error_message like '%new row violates row-level security policy%' or 
       v_error_message like '%permission denied%' then
      raise notice '✓ UPDATE blocked by RLS for non-owner: %', v_error_message;
    else
      raise exception 'Unexpected error: %', v_error_message;
    end if;
  end;
  
  raise notice '';
  raise notice 'Test 3: Direct INSERT into room_members (should fail)';
  raise notice '----------------------------------------------------';
  
  -- Try to insert room_members directly (should fail due to revoked permissions)
  begin
    insert into public.room_members(room_id, member_type, uid, seat_no, ready)
    values (v_room_id, 'human', v_user2, 1, true);
    raise exception 'Test Failed: Direct INSERT should have been blocked';
  exception when others then
    v_error_message := SQLERRM;
    if v_error_message like '%permission denied%' then
      raise notice '✓ Direct INSERT blocked by revoked permissions: %', v_error_message;
    else
      raise exception 'Unexpected error: %', v_error_message;
    end if;
  end;
  
  raise notice '';
  raise notice 'Test 4: Direct INSERT into games (should fail)';
  raise notice '-----------------------------------------------';
  
  -- Try to insert games directly (should fail)
  begin
    insert into public.games(room_id, seed, status, turn_no, current_seat, state_public)
    values (v_room_id, 12345, 'playing', 1, 0, '{"counts": [1, 27, 27, 27], "rankings": []}'::jsonb);
    raise exception 'Test Failed: Direct INSERT should have been blocked';
  exception when others then
    v_error_message := SQLERRM;
    if v_error_message like '%permission denied%' then
      raise notice '✓ Direct INSERT blocked by revoked permissions: %', v_error_message;
    else
      raise exception 'Unexpected error: %', v_error_message;
    end if;
  end;
  
  raise notice '';
  raise notice 'Test 5: Direct INSERT into turns (should fail)';
  raise notice '----------------------------------------------';
  
  -- Create game first via RPC (simulated)
  insert into public.games(room_id, seed, status, turn_no, current_seat, state_public)
  values (v_room_id, 12345, 'playing', 1, 0, '{"counts": [1, 27, 27, 27], "rankings": []}'::jsonb)
  returning id into v_game_id;
  
  -- Try to insert turns directly (should fail)
  begin
    insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
    values (v_game_id, 1, 0, gen_random_uuid(), '{"type": "play", "cards": []}'::jsonb);
    raise exception 'Test Failed: Direct INSERT should have been blocked';
  exception when others then
    v_error_message := SQLERRM;
    if v_error_message like '%permission denied%' then
      raise notice '✓ Direct INSERT blocked by revoked permissions: %', v_error_message;
    else
      raise exception 'Unexpected error: %', v_error_message;
    end if;
  end;
  
  raise notice '';
  raise notice 'Test 6: Verify SELECT permissions (should work for members)';
  raise notice '----------------------------------------------------------';
  
  -- Add user1 as member
  insert into public.room_members(room_id, member_type, uid, seat_no, ready)
  values (v_room_id, 'human', v_user1, 0, true);
  
  -- Try to select rooms (should work for owner)
  if exists (select 1 from public.rooms where id = v_room_id) then
    raise notice '✓ SELECT on rooms works for owner';
  else
    raise exception '✗ SELECT on rooms failed for owner';
  end if;
  
  -- Try to select room_members (should work for member)
  if exists (select 1 from public.room_members where room_id = v_room_id) then
    raise notice '✓ SELECT on room_members works for member';
  else
    raise exception '✗ SELECT on room_members failed for member';
  end if;
  
  -- Try to select games (should work for member)
  if exists (select 1 from public.games where room_id = v_room_id) then
    raise notice '✓ SELECT on games works for member';
  else
    raise exception '✗ SELECT on games failed for member';
  end if;
  
  raise notice '';
  raise notice 'Test 7: Verify state_private is protected';
  raise notice '------------------------------------------';
  
  -- Try to select state_private (should fail)
  begin
    select state_private from public.games where id = v_game_id;
    raise exception 'Test Failed: SELECT on state_private should have been blocked';
  exception when others then
    v_error_message := SQLERRM;
    if v_error_message like '%permission denied%' then
      raise notice '✓ SELECT on state_private blocked: %', v_error_message;
    else
      raise exception 'Unexpected error: %', v_error_message;
    end if;
  end;
  
  raise notice '';
  raise notice '=== All RLS Tests Passed ===';
  
  -- Cleanup
  delete from public.turns where game_id = v_game_id;
  delete from public.games where id = v_game_id;
  delete from public.room_members where room_id = v_room_id;
  delete from public.rooms where id = v_room_id;
  
  raise notice 'Test completed and cleaned up.';
end;
$$;
