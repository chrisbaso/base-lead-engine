alter table public.leads
add column if not exists first_name text,
add column if not exists quiz_answers jsonb not null default '{}'::jsonb,
add column if not exists recommended_software text,
add column if not exists utm_source text,
add column if not exists utm_campaign text,
add column if not exists utm_content text;

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists events_tenant_created_at_idx
on public.events (tenant_id, created_at desc);

create index if not exists events_lead_event_type_idx
on public.events (lead_id, event_type);

alter table public.events enable row level security;

drop policy if exists "tenant isolated events" on public.events;
create policy "tenant isolated events"
on public.events for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

insert into public.tenants (id, slug, name, primary_domain)
values ('44444444-4444-4444-8444-444444444444', 'hvac-ops-pro', 'HVAC Ops Pro', 'hvacopspro.com')
on conflict (slug) do update
set name = excluded.name,
    primary_domain = excluded.primary_domain;
