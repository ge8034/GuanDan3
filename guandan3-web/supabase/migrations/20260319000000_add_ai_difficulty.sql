-- Add AI difficulty support
-- This migration adds difficulty field to room_members table for AI players

-- Add difficulty column to room_members table
alter table public.room_members 
add column if not exists difficulty text not null default 'medium' 
check (difficulty in ('easy', 'medium', 'hard'));

-- Add comment for documentation
comment on column public.room_members.difficulty is 'AI difficulty level: easy, medium, or hard';

-- Create index for faster queries on AI difficulty
create index if not exists room_members_difficulty_idx 
on public.room_members(difficulty) 
where member_type = 'ai';
