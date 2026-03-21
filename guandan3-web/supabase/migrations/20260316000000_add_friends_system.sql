-- Migration script for Friends System
-- Add tables and functions for friend management

-- 1. Add additional fields to profiles table
alter table public.profiles 
add column if not exists status text default 'online' check (status in ('online', 'offline', 'away', 'busy')),
add column if not exists last_online_at timestamptz default now(),
add column if not exists level int default 1,
add column if not exists total_games int default 0,
add column if not exists win_rate numeric(5,2) default 0.00;

-- 2. Create friend_requests table
create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_uid uuid not null references auth.users(id) on delete cascade,
  receiver_uid uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(sender_uid, receiver_uid)
);

-- 3. Create friends table
create table if not exists public.friends (
  id uuid primary key default gen_random_uuid(),
  user1_uid uuid not null references auth.users(id) on delete cascade,
  user2_uid uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user1_uid, user2_uid)
);

-- 4. Create indexes for better performance
create index if not exists idx_friend_requests_sender on public.friend_requests(sender_uid);
create index if not exists idx_friend_requests_receiver on public.friend_requests(receiver_uid);
create index if not exists idx_friend_requests_status on public.friend_requests(status);
create index if not exists idx_friends_user1 on public.friends(user1_uid);
create index if not exists idx_friends_user2 on public.friends(user2_uid);

-- 5. Enable Row Level Security
alter table public.friend_requests enable row level security;
alter table public.friends enable row level security;

-- 6. RLS Policies for friend_requests
-- Users can view their own sent and received requests
create policy "Users can view their own friend requests"
on public.friend_requests for select
using (
  auth.uid() = sender_uid or 
  auth.uid() = receiver_uid
);

-- Users can create friend requests
create policy "Users can create friend requests"
on public.friend_requests for insert
with check (auth.uid() = sender_uid);

-- Users can update their own sent requests
create policy "Users can update their own sent requests"
on public.friend_requests for update
using (auth.uid() = sender_uid);

-- Users can delete their own requests
create policy "Users can delete their own requests"
on public.friend_requests for delete
using (
  auth.uid() = sender_uid or 
  auth.uid() = receiver_uid
);

-- 7. RLS Policies for friends
-- Users can view their friends
create policy "Users can view their friends"
on public.friends for select
using (
  auth.uid() = user1_uid or 
  auth.uid() = user2_uid
);

-- 8. Create function to update friend request timestamp
create or replace function update_friend_request_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 9. Create trigger for friend_requests
create trigger friend_requests_updated_at
before update on public.friend_requests
for each row
execute function update_friend_request_updated_at();

-- 10. Create function to accept friend request
create or replace function accept_friend_request(request_id uuid)
returns boolean as $$
declare
  v_sender_uid uuid;
  v_receiver_uid uuid;
  v_status text;
begin
  -- Get request details
  select sender_uid, receiver_uid, status
  into v_sender_uid, v_receiver_uid, v_status
  from public.friend_requests
  where id = request_id;
  
  -- Check if request exists and is pending
  if not found then
    raise exception 'Friend request not found';
  end if;
  
  if v_status != 'pending' then
    raise exception 'Friend request is not pending';
  end if;
  
  -- Check if receiver is the current user
  if auth.uid() != v_receiver_uid then
    raise exception 'You can only accept requests sent to you';
  end if;
  
  -- Update request status
  update public.friend_requests
  set status = 'accepted'
  where id = request_id;
  
  -- Create friendship (ensure consistent ordering)
  insert into public.friends (user1_uid, user2_uid)
  values (
    least(v_sender_uid, v_receiver_uid),
    greatest(v_sender_uid, v_receiver_uid)
  )
  on conflict do nothing;
  
  return true;
end;
$$ language plpgsql security definer;

-- 11. Create function to reject friend request
create or replace function reject_friend_request(request_id uuid)
returns boolean as $$
declare
  v_sender_uid uuid;
  v_receiver_uid uuid;
  v_status text;
begin
  -- Get request details
  select sender_uid, receiver_uid, status
  into v_sender_uid, v_receiver_uid, v_status
  from public.friend_requests
  where id = request_id;
  
  -- Check if request exists and is pending
  if not found then
    raise exception 'Friend request not found';
  end if;
  
  if v_status != 'pending' then
    raise exception 'Friend request is not pending';
  end if;
  
  -- Check if receiver is the current user
  if auth.uid() != v_receiver_uid then
    raise exception 'You can only reject requests sent to you';
  end if;
  
  -- Update request status
  update public.friend_requests
  set status = 'rejected'
  where id = request_id;
  
  return true;
end;
$$ language plpgsql security definer;

-- 12. Create function to cancel friend request
create or replace function cancel_friend_request(request_id uuid)
returns boolean as $$
declare
  v_sender_uid uuid;
  v_status text;
begin
  -- Get request details
  select sender_uid, status
  into v_sender_uid, v_status
  from public.friend_requests
  where id = request_id;
  
  -- Check if request exists and is pending
  if not found then
    raise exception 'Friend request not found';
  end if;
  
  if v_status != 'pending' then
    raise exception 'Friend request is not pending';
  end if;
  
  -- Check if sender is the current user
  if auth.uid() != v_sender_uid then
    raise exception 'You can only cancel your own requests';
  end if;
  
  -- Update request status
  update public.friend_requests
  set status = 'cancelled'
  where id = request_id;
  
  return true;
end;
$$ language plpgsql security definer;

-- 13. Create function to remove friend
create or replace function remove_friend(friend_uid uuid)
returns boolean as $$
begin
  -- Delete friendship (handles both orderings)
  delete from public.friends
  where (user1_uid = auth.uid() and user2_uid = friend_uid)
     or (user1_uid = friend_uid and user2_uid = auth.uid());
  
  return true;
end;
$$ language plpgsql security definer;

-- 14. Create function to get user's friends
create or replace function get_user_friends()
returns table (
  friend_uid uuid,
  nickname text,
  avatar_url text,
  status text,
  last_online_at timestamptz,
  level int,
  total_games int,
  win_rate numeric,
  created_at timestamptz
) as $$
begin
  return query
  select 
    case 
      when f.user1_uid = auth.uid() then f.user2_uid 
      else f.user1_uid 
    end as friend_uid,
    p.nickname,
    p.avatar_url,
    p.status,
    p.last_online_at,
    p.level,
    p.total_games,
    p.win_rate,
    f.created_at
  from public.friends f
  join public.profiles p on (
    (f.user1_uid = auth.uid() and p.uid = f.user2_uid) or
    (f.user2_uid = auth.uid() and p.uid = f.user1_uid)
  )
  where f.user1_uid = auth.uid() or f.user2_uid = auth.uid()
  order by p.last_online_at desc;
end;
$$ language plpgsql security definer;

-- 15. Create function to get pending friend requests
create or replace function get_pending_friend_requests()
returns table (
  request_id uuid,
  sender_uid uuid,
  receiver_uid uuid,
  sender_nickname text,
  sender_avatar_url text,
  created_at timestamptz
) as $$
begin
  return query
  select 
    fr.id as request_id,
    fr.sender_uid,
    fr.receiver_uid,
    p.nickname as sender_nickname,
    p.avatar_url as sender_avatar_url,
    fr.created_at
  from public.friend_requests fr
  join public.profiles p on p.uid = fr.sender_uid
  where fr.receiver_uid = auth.uid() 
    and fr.status = 'pending'
  order by fr.created_at desc;
end;
$$ language plpgsql security definer;

-- 16. Create function to get sent friend requests
create or replace function get_sent_friend_requests()
returns table (
  request_id uuid,
  sender_uid uuid,
  receiver_uid uuid,
  receiver_nickname text,
  receiver_avatar_url text,
  status text,
  created_at timestamptz
) as $$
begin
  return query
  select 
    fr.id as request_id,
    fr.sender_uid,
    fr.receiver_uid,
    p.nickname as receiver_nickname,
    p.avatar_url as receiver_avatar_url,
    fr.status,
    fr.created_at
  from public.friend_requests fr
  join public.profiles p on p.uid = fr.receiver_uid
  where fr.sender_uid = auth.uid()
  order by fr.created_at desc;
end;
$$ language plpgsql security definer;

-- 17. Create function to check if users are friends
create or replace function are_friends(target_uid uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.friends
    where (user1_uid = auth.uid() and user2_uid = target_uid)
       or (user1_uid = target_uid and user2_uid = auth.uid())
  );
end;
$$ language plpgsql security definer;

-- 18. Create function to update user online status
create or replace function update_user_status(user_status text)
returns boolean as $$
begin
  -- Validate status
  if user_status not in ('online', 'offline', 'away', 'busy') then
    raise exception 'Invalid status value';
  end if;
  
  -- Update status
  update public.profiles
  set 
    status = user_status,
    last_online_at = now()
  where uid = auth.uid();
  
  return true;
end;
$$ language plpgsql security definer;

-- 19. Grant execute permissions on functions
grant execute on function accept_friend_request(uuid) to authenticated;
grant execute on function reject_friend_request(uuid) to authenticated;
grant execute on function cancel_friend_request(uuid) to authenticated;
grant execute on function remove_friend(uuid) to authenticated;
grant execute on function get_user_friends() to authenticated;
grant execute on function get_pending_friend_requests() to authenticated;
grant execute on function get_sent_friend_requests() to authenticated;
grant execute on function are_friends(uuid) to authenticated;
grant execute on function update_user_status(text) to authenticated;

-- 20. Create function to search users by nickname
create or replace function search_users(search_term text, limit_count int default 20)
returns table (
  uid uuid,
  nickname text,
  avatar_url text,
  status text,
  level int,
  total_games int,
  win_rate numeric
) as $$
begin
  return query
  select 
    p.uid,
    p.nickname,
    p.avatar_url,
    p.status,
    p.level,
    p.total_games,
    p.win_rate
  from public.profiles p
  where p.uid != auth.uid()
    and p.nickname ilike '%' || search_term || '%'
  order by 
    case when p.status = 'online' then 0 else 1 end,
    p.nickname
  limit limit_count;
end;
$$ language plpgsql security definer;

grant execute on function search_users(text, int) to authenticated;

-- 21. Add comments for documentation
comment on table public.friend_requests is 'Stores friend requests between users';
comment on table public.friends is 'Stores established friendships between users';
comment on function accept_friend_request(uuid) is 'Accept a pending friend request';
comment on function reject_friend_request(uuid) is 'Reject a pending friend request';
comment on function cancel_friend_request(uuid) is 'Cancel a sent friend request';
comment on function remove_friend(uuid) is 'Remove a friend from friends list';
comment on function get_user_friends() is 'Get current user''s friends list';
comment on function get_pending_friend_requests() is 'Get pending friend requests received by current user';
comment on function get_sent_friend_requests() is 'Get friend requests sent by current user';
comment on function are_friends(uuid) is 'Check if current user is friends with target user';
comment on function update_user_status(text) is 'Update current user''s online status';
comment on function search_users(text, int) is 'Search users by nickname';
