-- 修复 submit_turn RPC 对匿名用户的授权
-- 问题：练习模式使用匿名用户，但 submit_turn 只授权给 authenticated 角色
-- 解决：同时授权给 anon 和 authenticated 角色
-- 2026-04-05

-- 授权给 anon 角色（用于练习模式匿名用户）
grant execute on function public.submit_turn(uuid, uuid, int, jsonb) to anon;

-- 授权给 authenticated 角色（用于登录用户）
grant execute on function public.submit_turn(uuid, uuid, int, jsonb) to authenticated;

-- 验证授权
do $$
declare
  v_has_grant_anon boolean;
  v_has_grant_auth boolean;
begin
  select has_function_privilege('anon', 'public.submit_turn(uuid, uuid, int, jsonb)', 'EXECUTE')
    into v_has_grant_anon;
  select has_function_privilege('authenticated', 'public.submit_turn(uuid, uuid, int, jsonb)', 'EXECUTE')
    into v_has_grant_auth;

  if v_has_grant_anon and v_has_grant_auth then
    raise notice '✅ submit_turn RPC 授权成功：anon=%, authenticated=%', v_has_grant_anon, v_has_grant_auth;
  else
    raise warning '⚠️ submit_turn RPC 授权可能有问题：anon=%, authenticated=%', v_has_grant_anon, v_has_grant_auth;
  end if;
end $$;
