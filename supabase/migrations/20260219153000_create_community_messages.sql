-- Create community_messages table if it doesn't exist
create table if not exists public.community_messages (
    id uuid default gen_random_uuid(),
    user_id uuid references auth.users(id) not null,
    content text not null,
    user_name text, 
    avatar_url text, -- optional
    created_at timestamptz default now(),
    primary key (id)
);

-- Ensure RLS is enabled
alter table public.community_messages enable row level security;

-- SAFELY CREATE POLICIES (Drop first to avoid conflicts)
drop policy if exists "Allow public read access" on public.community_messages;
create policy "Allow public read access"
on public.community_messages for select
using ( true );

drop policy if exists "Allow authenticated insert" on public.community_messages;
create policy "Allow authenticated insert"
on public.community_messages for insert
with check ( auth.uid() = user_id );

-- Enable Realtime safely
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'community_messages') then
    alter publication supabase_realtime add table community_messages;
  end if;
end $$;
