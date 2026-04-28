create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  primary_domain text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text,
  phone text,
  status text not null default 'new',
  score integer not null default 0,
  source jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists leads_tenant_email_unique
on public.leads (tenant_id, email)
where email is not null;

create table if not exists public.lead_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  event_name text not null,
  event_id text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create unique index if not exists lead_events_tenant_event_id_unique
on public.lead_events (tenant_id, event_id)
where event_id is not null;

create table if not exists public.email_sends (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  sequence_id text not null,
  step_index integer not null,
  recipient_email text not null,
  subject text not null,
  template text not null,
  status text not null default 'pending',
  scheduled_for timestamptz not null,
  sent_at timestamptz,
  provider_message_id text,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists email_sends_pending_idx
on public.email_sends (scheduled_for)
where status = 'pending';

create table if not exists public.email_suppressions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  reason text not null,
  source text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, email)
);

create table if not exists public.crm_sync_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  provider text not null,
  operation text not null,
  status text not null,
  attempts integer not null default 0,
  next_retry_at timestamptz,
  payload jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now()
);

alter table public.tenants enable row level security;
alter table public.leads enable row level security;
alter table public.lead_events enable row level security;
alter table public.email_sends enable row level security;
alter table public.email_suppressions enable row level security;
alter table public.crm_sync_log enable row level security;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id', '')::uuid
$$;

create policy "tenant select own tenant"
on public.tenants for select
using (id = public.current_tenant_id());

create policy "tenant isolated leads"
on public.leads for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant isolated lead events"
on public.lead_events for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant isolated email sends"
on public.email_sends for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant isolated email suppressions"
on public.email_suppressions for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

create policy "tenant isolated crm sync log"
on public.crm_sync_log for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

insert into public.tenants (id, slug, name, primary_domain)
values ('11111111-1111-4111-8111-111111111111', 'demo', 'Demo Lead Engine', 'demo.localhost')
on conflict (slug) do update
set name = excluded.name,
    primary_domain = excluded.primary_domain;
