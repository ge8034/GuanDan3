-- 删除旧函数
drop function if exists public.create_practice_room(text);

-- 重新创建函数，使用正确的SQLSTATE代码
create or replace function public.create_practice_room(p_visibility text default 'private', p_user_id uuid default null)
returns table(room_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_room_id uuid;
  v_owner_uid uuid;
begin
  v_owner_uid := coalesce(p_user_id, auth.uid());
  if v_owner_uid is null then
    raise exception '用户未认证' using errcode = 'unauthorized_identifier';
  end if;
  insert into public.rooms(owner_uid, mode, visibility, status)
  values (v_owner_uid, 'pve1v3', p_visibility, 'open')
  returning id into v_room_id;
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
