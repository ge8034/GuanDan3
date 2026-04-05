-- 在 api schema 中创建 submit_turn 包装函数
-- PostgREST API 在 api schema 中查找RPC函数
-- 2026-04-05

-- 删除旧的包装函数（如果存在）
drop function if exists api.submit_turn(uuid, uuid, int, jsonb) cascade;

-- 创建 api schema 中的包装函数，调用 public.submit_turn
create or replace function api.submit_turn(
  p_game_id uuid,
  p_action_id uuid,
  p_expected_turn_no int,
  p_payload jsonb
)
returns table(
  turn_no int,
  current_seat int,
  status text,
  rankings int[]
)
language plpgsql
security definer
set search_path = public, api
as $$
declare
  v_turn_no int;
  v_current_seat int;
  v_status text;
  v_rankings int[];
begin
  -- 调用 public schema 中的实际函数并获取结果
  select * into v_turn_no, v_current_seat, v_status, v_rankings
  from public.submit_turn(p_game_id, p_action_id, p_expected_turn_no, p_payload)
  limit 1;

  -- 返回结果
  return query select v_turn_no, v_current_seat, v_status, v_rankings;
end;
$$;

-- 授权给 anon 和 authenticated
grant execute on function api.submit_turn(uuid, uuid, int, jsonb) to anon;
grant execute on function api.submit_turn(uuid, uuid, int, jsonb) to authenticated;

-- 验证
do $$
declare
  v_exists boolean;
begin
  select exists(
    select 1 from information_schema.routines
    where routine_schema = 'api'
    and routine_name = 'submit_turn'
  ) into v_exists;

  if v_exists then
    raise notice '✅ api.submit_turn 包装函数创建成功';
  else
    raise warning '⚠️ api.submit_turn 包装函数可能未创建';
  end if;
end $$;
