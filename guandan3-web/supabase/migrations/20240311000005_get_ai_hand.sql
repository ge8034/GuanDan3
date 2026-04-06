-- 20240311000005_get_ai_hand.sql
-- RPC to fetch AI hands for client-side AI logic
-- Security fix: Only allow fetching AI seat hands or current user's own hand

create or replace function public.get_ai_hand(
  p_game_id uuid,
  p_seat_no int
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
  v_hand jsonb;
  v_is_ai boolean;
  v_my_seat_no int;
begin
  -- 1. Get Room ID
  select room_id into v_room_id
  from public.games
  where id = p_game_id;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. Check if requested seat is AI or current user's seat
  select (member_type = 'ai'), seat_no
    into v_is_ai, v_my_seat_no
  from public.room_members
  where room_id = v_room_id and seat_no = p_seat_no;

  -- Security: Only allow if:
  --   a) Requested seat is an AI seat, OR
  --   b) Requested seat belongs to the current user
  if not v_is_ai and v_my_seat_no is null then
    raise exception 'Seat not found';
  end if;

  if not v_is_ai and (select uid from public.room_members where room_id = v_room_id and seat_no = p_seat_no) <> auth.uid() then
    raise exception 'Unauthorized: Cannot access other player hand';
  end if;

  -- 3. Verify Caller is a Member of the Room (Basic security)
  if not exists (
    select 1 from public.room_members
    where room_id = v_room_id and uid = auth.uid()
  ) then
    raise exception 'Unauthorized: Not a room member';
  end if;

  -- 4. Fetch Hand
  select hand into v_hand
  from public.game_hands
  where game_id = p_game_id and seat_no = p_seat_no;

  return v_hand;
end;
$$;
