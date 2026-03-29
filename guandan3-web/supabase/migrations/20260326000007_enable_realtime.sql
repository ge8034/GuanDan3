-- 启用 games 表的 Realtime 功能
-- 20260326000007_enable_realtime.sql

-- 删除现有的 Realtime publication（如果存在）
drop publication if exists supabase_realtime;

-- 重新创建 Realtime publication，包含需要的表
create publication supabase_realtime for table games;
alter publication supabase_realtime add table turns;
alter publication supabase_realtime add table room_members;
alter publication supabase_realtime add table rooms;

-- 确保 games 表的 updated_at 触发器存在
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 为 games 表添加 updated_at 触发器（如果不存在）
drop trigger if exists games_handle_updated_at on public.games;
create trigger games_handle_updated_at
  before update on public.games
  for each row
  execute procedure public.handle_updated_at();
