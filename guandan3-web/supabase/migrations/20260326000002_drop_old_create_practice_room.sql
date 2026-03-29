-- 先删除旧版本的函数（只有一个参数的版本）
drop function if exists public.create_practice_room(text);

-- 重新创建函数，添加 p_user_id 参数
create or replace function public.create_practice_room(
  p_visibility text default 'private',
  p_user_id uuid default null
)
returns table(room_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
  v_owner_uid uuid;
begin
  -- 使用传入的用户ID，如果未提供则使用auth.uid()
  v_owner_uid := coalesce(p_user_id, auth.uid());

  -- 验证用户ID不为空
  if v_owner_uid is null then
    raise exception '用户未认证' using errcode = '401';
  end if;

  -- Insert room
  insert into public.rooms(owner_uid, mode, visibility, status)
  values (v_owner_uid, 'pve1v3', p_visibility, 'open')
  returning id into v_room_id;

  -- Insert members (Human + 3 AI)
  insert into public.room_members(room_id, member_type, uid, ai_key, seat_no, ready)
  values
    (v_room_id, 'human', v_owner_uid, null, 0, true),
    (v_room_id, 'ai', null, 'bot_easy_1', 1, true),
    (v_room_id, 'ai', null, 'bot_easy_2', 2, true),
    (v_room_id, 'ai', null, 'bot_easy_3', 3, true);

  return query select v_room_id;
end;
$$;

grant execute on function public.create_practice_room(text, uuid) to authenticated;
