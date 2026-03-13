-- 20240311000005_get_ai_hand.sql
-- RPC to fetch AI hands for client-side AI logic

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
begin
  -- 1. Get Room ID
  select room_id into v_room_id
  from public.games
  where id = p_game_id;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  -- 2. Verify Caller is a Member of the Room (Basic security)
  if not exists (
    select 1 from public.room_members
    where room_id = v_room_id and uid = auth.uid()
  ) then
    raise exception 'Unauthorized';
  end if;

  -- 3. Fetch Hand
  select hand into v_hand
  from public.game_hands
  where game_id = p_game_id and seat_no = p_seat_no;

  return v_hand;
end;
$$;
