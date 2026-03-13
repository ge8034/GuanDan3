create or replace function public.get_turns_since(
  p_game_id uuid,
  p_from_turn_no int
)
returns table(turn_no int, seat_no int, payload jsonb)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
begin
  select room_id into v_room_id
  from public.games
  where id = p_game_id;

  if v_room_id is null then
    raise exception 'Game not found';
  end if;

  if not public.fn_is_room_member(v_room_id) then
    raise exception 'Not a member of this room';
  end if;

  return query
  select t.turn_no, t.seat_no, t.payload
  from public.turns t
  where t.game_id = p_game_id
    and t.turn_no > p_from_turn_no
  order by t.turn_no asc;
end;
$$;

grant execute on function public.get_turns_since(uuid, int) to authenticated;

