-- 确保 RLS 策略正确启用
-- 20260326000006_ensure_rls_enabled.sql

-- 1. 确认表上启用了 RLS
alter table public.games enable row level security;
alter table public.game_hands enable row level security;
alter table public.turns enable row level security;
alter table public.scores enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

-- 2. 重新创建辅助函数（如果不存在）
create or replace function public.fn_is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.room_members
    where room_id = p_room_id
    and uid = auth.uid()
  );
$$;

-- 3. 重新创建 game_hands 的访问策略
drop policy if exists "hands_select_all" on public.game_hands;
drop policy if exists "hands_select_self_seat" on public.game_hands;

-- 简化策略：房间成员可以查看所有手牌（简化测试）
create policy "hands_select_all" on public.game_hands
  for select using (
    exists (
      select 1
      from public.games g
      join public.room_members m on m.room_id = g.room_id
      where g.id = game_hands.game_id
      and m.uid = auth.uid()
    )
  );

-- 4. 重新创建 games 的访问策略
drop policy if exists "games_select_by_member" on public.games;
drop policy if exists "games_select_all" on public.games;

create policy "games_select_by_member" on public.games
  for select using (
    exists (
      select 1
      from public.room_members
      where room_id = games.room_id
      and uid = auth.uid()
    )
  );

-- 5. 给予权限（匿名用户需要读取权限）
grant usage on schema public to anon;
grant select on all tables in schema public to anon;
