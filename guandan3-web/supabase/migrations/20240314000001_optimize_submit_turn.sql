-- 20240314000001_optimize_submit_turn.sql
-- Optimize submit_turn RPC performance by adding missing indexes

-- 1. Add index on games.room_id for faster room lookups
-- This improves the query: select g.room_id, g.current_seat, g.turn_no from public.games g where g.id = p_game_id
create index if not exists games_room_id_idx on public.games(room_id);

-- 2. Add composite index on room_members(room_id, seat_no) for faster current seat lookups
-- This improves the query: select member_type, uid, seat_no from public.room_members where room_id = v_room_id and seat_no = v_current_seat
create index if not exists room_members_room_seat_idx on public.room_members(room_id, seat_no);

-- 3. Add composite index on room_members(room_id, uid) for faster membership checks
-- This improves the query: select seat_no from public.room_members where room_id = v_room_id and uid = auth.uid()
-- Note: This complements the existing unique index room_members_room_uid_uq which is a partial index
create index if not exists room_members_room_uid_idx on public.room_members(room_id, uid) where uid is not null;

-- 4. Add index on turns.game_id for faster turn history queries
-- This improves queries like: select * from public.turns where game_id = p_game_id order by turn_no
create index if not exists turns_game_id_idx on public.turns(game_id);

-- 5. Add index on games.updated_at for cleanup queries
-- This helps with queries that filter by updated_at for cleanup or monitoring
create index if not exists games_updated_at_idx on public.games(updated_at);

-- 6. Add index on room_members.last_seen_at for timeout cleanup
-- This helps with queries that filter by last_seen_at for timeout handling
create index if not exists room_members_last_seen_at_idx on public.room_members(last_seen_at);

-- 7. Optimize submit_turn function to reduce redundant queries
create or replace function public.submit_turn(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn_no int,
  p_payload jsonb
)
returns table(turn_no int, current_seat int)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
  v_current_seat int;
  v_turn_no int;
  v_my_seat int;
  v_actor_seat int;
  v_is_ai boolean;
  v_member_type text;
  v_member_uid uuid;
  v_is_member boolean;
begin
  -- 1. Lock game and get state (single query with index on games.id)
  select g.room_id, g.current_seat, g.turn_no
    into v_room_id, v_current_seat, v_turn_no
  from public.games g
  where g.id = p_game_id
  for update;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. Validate Turn Number (early exit)
  if v_turn_no <> p_expected_turn_no then
    raise exception 'turn_no_mismatch: Expected %, Got %', v_turn_no, p_expected_turn_no;
  end if;

  -- 3. Identify Actor and check membership in single query (uses room_members_room_seat_idx)
  select 
    member_type, 
    uid,
    seat_no
  into 
    v_member_type,
    v_member_uid,
    v_actor_seat
  from public.room_members
  where room_id = v_room_id and seat_no = v_current_seat;

  if v_actor_seat is null then
    raise exception 'Current seat % is empty!', v_current_seat;
  end if;

  -- 4. Determine if AI
  v_is_ai := (v_member_type = 'ai') OR (v_member_uid IS NULL);

  -- 5. Authorize Action (uses room_members_room_uid_idx)
  if v_is_ai then
    -- Any member can trigger AI move
    select exists(
      select 1 from public.room_members 
      where room_id = v_room_id and uid = auth.uid()
    ) into v_is_member;
    
    if not v_is_member then
      raise exception 'Unauthorized: Only room members can trigger AI moves';
    end if;
  else
    -- Human turn check
    select seat_no into v_my_seat
    from public.room_members
    where room_id = v_room_id and uid = auth.uid();

    if v_my_seat is null or v_my_seat <> v_current_seat then
      raise exception 'not_your_turn: You are Seat %, Current is Seat % (Type: %, UID: %)', 
        v_my_seat, v_current_seat, v_member_type, v_member_uid;
    end if;
  end if;

  -- 6. Execute Move (uses turns_game_turn_no_uq for uniqueness)
  insert into public.turns(game_id, turn_no, seat_no, action_id, payload)
  values (p_game_id, v_turn_no, v_current_seat, p_action_id, p_payload);

  -- 7. Update game state (uses games_room_id_idx for FK constraint)
  update public.games
    set turn_no = v_turn_no + 1,
        current_seat = (v_current_seat + 1) % 4,
        updated_at = now()
  where id = p_game_id;

  return query
    select v_turn_no + 1, (v_current_seat + 1) % 4;
end;
$$;

-- 8. Add comment for documentation
comment on index public.games_room_id_idx is 'Optimize room lookups in submit_turn and game queries';
comment on index public.room_members_room_seat_idx is 'Optimize current seat lookups in submit_turn';
comment on index public.room_members_room_uid_idx is 'Optimize membership checks in submit_turn';
comment on index public.turns_game_id_idx is 'Optimize turn history queries';
comment on index public.games_updated_at_idx is 'Optimize cleanup and monitoring queries';
comment on index public.room_members_last_seen_at_idx is 'Optimize timeout cleanup queries';
