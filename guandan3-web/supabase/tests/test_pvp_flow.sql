-- supabase/tests/test_pvp_flow.sql
-- Run this in Supabase SQL Editor to verify PVP logic

begin;

-- 1. Setup: Create 4 dummy users (if not exist, we just simulate uids)
-- In a real test we'd create users, but here we'll just generate UUIDs for simulation
-- However, constraints require valid auth.users. 
-- For SQL testing, we can temporarily bypass RLS or use a mock approach if we can't create users.
-- EASIER APPROACH: Just verify the logic using variables and assume auth.uid() is mocked or we insert directly.

-- Since we can't easily mock auth.uid() in a transaction script without extensions,
-- we will insert directly into tables assuming we are superuser (Postgres role).

do $$
declare
  v_owner_uid uuid;
  v_user1 uuid;
  v_user2 uuid;
  v_user3 uuid;
  v_room_id uuid;
  v_game_id uuid;
begin
  -- Get a real user or create a dummy one if possible. 
  -- We'll try to pick an existing user from auth.users to avoid FK errors.
  select id into v_owner_uid from auth.users limit 1;
  
  if v_owner_uid is null then
    raise notice 'No users found in auth.users. Please sign up at least one user first.';
    return;
  end if;

  -- Generate fake UIDs for others (This might fail FK if auth.users check is strict and we can't insert into auth.users)
  -- If we are running as postgres/service_role, we might be able to insert into auth.users?
  -- Usually in Supabase SQL Editor we are postgres.
  v_user1 := gen_random_uuid();
  v_user2 := gen_random_uuid();
  v_user3 := gen_random_uuid();

  -- Try to insert dummy users (might fail if not allowed)
  begin
    insert into auth.users (id, email) values (v_user1, 'bot1@test.com'), (v_user2, 'bot2@test.com'), (v_user3, 'bot3@test.com');
  exception when others then
    raise notice 'Could not insert dummy users (expected if restricted). Using existing if available or failing.';
    -- If we can't insert users, we can't fully test FK constraints. 
    -- Let's assume for this test we only test the ROOM logic, bypassing FKs if possible? No, FKs are strict.
    -- We will try to find 3 other users.
    select id into v_user1 from auth.users where id <> v_owner_uid limit 1;
    -- If we don't have enough users, we abort this test script.
    if v_user1 is null then
       raise exception 'Need at least 2 users in auth.users to run this test';
    end if;
    -- Reuse users if we have to, just to test room logic
    v_user2 := v_user1; 
    v_user3 := v_owner_uid; -- This is hacky, but valid for DB constraints (one user multiple seats?)
    -- Actually room_members has unique(room_id, uid). So we cannot reuse UIDs in same room.
    -- So this SQL test is hard to run without 4 real users.
  end;

  -- OK, assuming we managed to get UIDs (or we just skip the FK part by mocking tables? No.)
  -- Let's focus on verifying the FUNCTION logic by calling it.
  
  -- 2. Create Room
  -- We need to mock auth.uid() for the function call.
  -- set local role authenticated; -- Can't easily set config 'request.jwt.claim.sub' in SQL script.

  -- DIRECT INSERT APPROACH (Bypassing RPCs to test Table Logic & Start Game RPC)
  
  insert into public.rooms (owner_uid, name, mode, type, status)
  values (v_owner_uid, 'Test PVP Room', 'pvp4', 'classic', 'open')
  returning id into v_room_id;
  
  raise notice 'Room Created: %', v_room_id;

  -- 3. Add Members
  insert into public.room_members (room_id, uid, seat_no, ready, member_type)
  values 
    (v_room_id, v_owner_uid, 0, true, 'human'),
    (v_room_id, v_user1, 1, false, 'human'),
    (v_room_id, v_user2, 2, false, 'human'),
    (v_room_id, v_user3, 3, true, 'human');

  raise notice 'Members Added';

  -- 4. Try Start Game (Should Fail)
  begin
    perform public.start_game(v_room_id);
    raise exception 'Test Failed: start_game should have failed due to unready players';
  exception when others then
    if SQLERRM like '%Not all players are ready%' then
       raise notice 'Success: Blocked start because players are not ready';
    else
       raise exception 'Unexpected error: %', SQLERRM;
    end if;
  end;

  -- 5. Make everyone ready
  update public.room_members set ready = true where room_id = v_room_id;

  -- 6. Try Start Game (Should Success)
  perform public.start_game(v_room_id);
  
  select id into v_game_id from public.games where room_id = v_room_id;
  if v_game_id is not null then
    raise notice 'Success: Game Started %', v_game_id;
  else
    raise exception 'Test Failed: Game not created';
  end if;

  -- Cleanup
  -- delete from auth.users where id in (v_user1, v_user2, v_user3) and email like 'bot%@test.com';
  -- rollback; -- Uncomment to keep DB clean
end;
$$;
rollback; -- Always rollback changes in this test
