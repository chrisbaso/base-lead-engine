create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text,
  current_system text,
  source text default 'landing_v1',
  created_at timestamptz default now()
);

alter table public.waitlist enable row level security;

drop policy if exists "anon can insert waitlist" on public.waitlist;

create policy "anon can insert waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);
