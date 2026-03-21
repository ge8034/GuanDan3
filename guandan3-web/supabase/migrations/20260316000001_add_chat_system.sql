-- Migration script for Chat System
-- Add tables and functions for private messaging between friends

-- 1. Create chat_rooms table
create table if not exists public.chat_rooms (
  id uuid primary key default gen_random_uuid(),
  user1_uid uuid not null references auth.users(id) on delete cascade,
  user2_uid uuid not null references auth.users(id) on delete cascade,
  last_message_at timestamptz default now(),
  created_at timestamptz not null default now(),
  unique(user1_uid, user2_uid)
);

-- 2. Create chat_messages table
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.chat_rooms(id) on delete cascade,
  sender_uid uuid not null references auth.users(id) on delete cascade,
  receiver_uid uuid not null references auth.users(id) on delete cascade,
  content text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- 3. Create indexes for better performance
create index if not exists idx_chat_rooms_user1 on public.chat_rooms(user1_uid);
create index if not exists idx_chat_rooms_user2 on public.chat_rooms(user2_uid);
create index if not exists idx_chat_rooms_last_message on public.chat_rooms(last_message_at desc);
create index if not exists idx_chat_messages_room_id on public.chat_messages(room_id);
create index if not exists idx_chat_messages_sender on public.chat_messages(sender_uid);
create index if not exists idx_chat_messages_receiver on public.chat_messages(receiver_uid);
create index if not exists idx_chat_messages_created on public.chat_messages(created_at desc);
create index if not exists idx_chat_messages_unread on public.chat_messages(receiver_uid, is_read) where is_read = false;

-- 4. Enable Row Level Security
alter table public.chat_rooms enable row level security;
alter table public.chat_messages enable row level security;

-- 5. RLS Policies for chat_rooms
-- Users can view chat rooms they are part of
create policy "Users can view their chat rooms"
on public.chat_rooms for select
using (
  auth.uid() = user1_uid or 
  auth.uid() = user2_uid
);

-- Users can create chat rooms
create policy "Users can create chat rooms"
on public.chat_rooms for insert
with check (
  auth.uid() = user1_uid or 
  auth.uid() = user2_uid
);

-- Users can update chat rooms (last_message_at)
create policy "Users can update their chat rooms"
on public.chat_rooms for update
using (
  auth.uid() = user1_uid or 
  auth.uid() = user2_uid
);

-- 6. RLS Policies for chat_messages
-- Users can view messages in their chat rooms
create policy "Users can view their chat messages"
on public.chat_messages for select
using (
  auth.uid() = sender_uid or 
  auth.uid() = receiver_uid
);

-- Users can create messages
create policy "Users can create chat messages"
on public.chat_messages for insert
with check (auth.uid() = sender_uid);

-- Users can update messages (mark as read)
create policy "Users can update received messages"
on public.chat_messages for update
using (auth.uid() = receiver_uid)
with check (auth.uid() = receiver_uid);

-- 7. Create function to get or create chat room
create or replace function get_or_create_chat_room(target_uid uuid)
returns table (
  room_id uuid,
  user1_uid uuid,
  user2_uid uuid,
  last_message_at timestamptz,
  created_at timestamptz
) as $$
declare
  v_room_id uuid;
  v_user1_uid uuid;
  v_user2_uid uuid;
begin
  -- Ensure consistent ordering
  v_user1_uid := least(auth.uid(), target_uid);
  v_user2_uid := greatest(auth.uid(), target_uid);
  
  -- Try to get existing room
  select id into v_room_id
  from public.chat_rooms
  where user1_uid = v_user1_uid and user2_uid = v_user2_uid;
  
  -- If room doesn't exist, create it
  if v_room_id is null then
    insert into public.chat_rooms (user1_uid, user2_uid)
    values (v_user1_uid, v_user2_uid)
    returning id into v_room_id;
  end if;
  
  -- Return the room
  return query
  select 
    cr.id as room_id,
    cr.user1_uid,
    cr.user2_uid,
    cr.last_message_at,
    cr.created_at
  from public.chat_rooms cr
  where cr.id = v_room_id;
end;
$$ language plpgsql security definer;

-- 8. Create function to send message
create or replace function send_message(target_uid uuid, message_content text)
returns table (
  message_id uuid,
  room_id uuid,
  sender_uid uuid,
  receiver_uid uuid,
  content text,
  is_read boolean,
  created_at timestamptz
) as $$
declare
  v_room_id uuid;
  v_user1_uid uuid;
  v_user2_uid uuid;
  v_message_id uuid;
begin
  -- Ensure consistent ordering
  v_user1_uid := least(auth.uid(), target_uid);
  v_user2_uid := greatest(auth.uid(), target_uid);
  
  -- Get or create room
  select id into v_room_id
  from public.chat_rooms
  where user1_uid = v_user1_uid and user2_uid = v_user2_uid;
  
  if v_room_id is null then
    insert into public.chat_rooms (user1_uid, user2_uid)
    values (v_user1_uid, v_user2_uid)
    returning id into v_room_id;
  end if;
  
  -- Insert message
  insert into public.chat_messages (room_id, sender_uid, receiver_uid, content)
  values (v_room_id, auth.uid(), target_uid, message_content)
  returning id into v_message_id;
  
  -- Update room's last_message_at
  update public.chat_rooms
  set last_message_at = now()
  where id = v_room_id;
  
  -- Return the message
  return query
  select 
    cm.id as message_id,
    cm.room_id,
    cm.sender_uid,
    cm.receiver_uid,
    cm.content,
    cm.is_read,
    cm.created_at
  from public.chat_messages cm
  where cm.id = v_message_id;
end;
$$ language plpgsql security definer;

-- 9. Create function to get chat messages
create or replace function get_chat_messages(room_id uuid, limit_count int default 50, before_timestamp timestamptz default null)
returns table (
  message_id uuid,
  room_id uuid,
  sender_uid uuid,
  receiver_uid uuid,
  content text,
  is_read boolean,
  read_at timestamptz,
  created_at timestamptz
) as $$
begin
  return query
  select 
    cm.id as message_id,
    cm.room_id,
    cm.sender_uid,
    cm.receiver_uid,
    cm.content,
    cm.is_read,
    cm.read_at,
    cm.created_at
  from public.chat_messages cm
  where cm.room_id = room_id
    and (before_timestamp is null or cm.created_at < before_timestamp)
  order by cm.created_at desc
  limit limit_count;
end;
$$ language plpgsql security definer;

-- 10. Create function to mark messages as read
create or replace function mark_messages_as_read(room_id uuid)
returns int as $$
declare
  v_count int;
begin
  update public.chat_messages
  set 
    is_read = true,
    read_at = now()
  where room_id = room_id
    and receiver_uid = auth.uid()
    and is_read = false;
  
  get diagnostics v_count = row_count;
  return v_count;
end;
$$ language plpgsql security definer;

-- 11. Create function to get user's chat rooms
create or replace function get_user_chat_rooms()
returns table (
  room_id uuid,
  other_user_uid uuid,
  other_user_nickname text,
  other_user_avatar_url text,
  other_user_status text,
  last_message_content text,
  last_message_at timestamptz,
  unread_count int
) as $$
begin
  return query
  select 
    cr.id as room_id,
    case 
      when cr.user1_uid = auth.uid() then cr.user2_uid 
      else cr.user1_uid 
    end as other_user_uid,
    p.nickname as other_user_nickname,
    p.avatar_url as other_user_avatar_url,
    p.status as other_user_status,
    (
      select cm.content 
      from public.chat_messages cm 
      where cm.room_id = cr.id 
      order by cm.created_at desc 
      limit 1
    ) as last_message_content,
    cr.last_message_at,
    (
      select count(*)
      from public.chat_messages cm
      where cm.room_id = cr.id
        and cm.receiver_uid = auth.uid()
        and cm.is_read = false
    ) as unread_count
  from public.chat_rooms cr
  join public.profiles p on (
    (cr.user1_uid = auth.uid() and p.uid = cr.user2_uid) or
    (cr.user2_uid = auth.uid() and p.uid = cr.user1_uid)
  )
  where cr.user1_uid = auth.uid() or cr.user2_uid = auth.uid()
  order by cr.last_message_at desc;
end;
$$ language plpgsql security definer;

-- 12. Create function to get unread message count
create or replace function get_unread_message_count()
returns int as $$
begin
  return (
    select count(*)
    from public.chat_messages cm
    join public.chat_rooms cr on cm.room_id = cr.id
    where cm.receiver_uid = auth.uid()
      and cm.is_read = false
      and (cr.user1_uid = auth.uid() or cr.user2_uid = auth.uid())
  );
end;
$$ language plpgsql security definer;

-- 13. Create function to delete message
create or replace function delete_message(message_id uuid)
returns boolean as $$
declare
  v_sender_uid uuid;
begin
  select sender_uid into v_sender_uid
  from public.chat_messages
  where id = message_id;
  
  if v_sender_uid is null then
    raise exception 'Message not found';
  end if;
  
  if v_sender_uid != auth.uid() then
    raise exception 'You can only delete your own messages';
  end if;
  
  delete from public.chat_messages
  where id = message_id;
  
  return true;
end;
$$ language plpgsql security definer;

-- 14. Grant execute permissions on functions
grant execute on function get_or_create_chat_room(uuid) to authenticated;
grant execute on function send_message(uuid, text) to authenticated;
grant execute on function get_chat_messages(uuid, int, timestamptz) to authenticated;
grant execute on function mark_messages_as_read(uuid) to authenticated;
grant execute on function get_user_chat_rooms() to authenticated;
grant execute on function get_unread_message_count() to authenticated;
grant execute on function delete_message(uuid) to authenticated;

-- 15. Enable realtime for chat_messages
alter publication supabase_realtime add table public.chat_messages;

-- 16. Add comments for documentation
comment on table public.chat_rooms is 'Stores chat rooms between two users';
comment on table public.chat_messages is 'Stores messages in chat rooms';
comment on function get_or_create_chat_room(uuid) is 'Get or create a chat room with target user';
comment on function send_message(uuid, text) is 'Send a message to target user';
comment on function get_chat_messages(uuid, int, timestamptz) is 'Get messages from a chat room';
comment on function mark_messages_as_read(uuid) is 'Mark all messages in a room as read';
comment on function get_user_chat_rooms() is 'Get all chat rooms for current user';
comment on function get_unread_message_count() is 'Get total unread message count';
comment on function delete_message(uuid) is 'Delete a message';
