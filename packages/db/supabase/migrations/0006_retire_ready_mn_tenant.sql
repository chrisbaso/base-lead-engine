alter table public.leads
add column if not exists last_name text,
add column if not exists age integer,
add column if not exists current_savings numeric,
add column if not exists target_retirement_age integer,
add column if not exists monthly_social_security numeric,
add column if not exists desired_monthly_income numeric,
add column if not exists retirement_score integer,
add column if not exists score_band text,
add column if not exists assigned_advisor_id uuid,
add column if not exists advisor_notes text,
add column if not exists appointment_booked_at timestamptz,
add column if not exists appointment_held_at timestamptz,
add column if not exists case_opened_at timestamptz,
add column if not exists case_closed_at timestamptz,
add column if not exists premium_amount numeric,
add column if not exists override_earned numeric;

create table if not exists public.advisors (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  email text not null,
  geography text not null,
  current_capacity integer not null default 0,
  accepting_leads boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.leads
drop constraint if exists leads_assigned_advisor_id_fkey;

alter table public.leads
add constraint leads_assigned_advisor_id_fkey
foreign key (assigned_advisor_id) references public.advisors(id) on delete set null;

create table if not exists public.ad_spend (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source text not null,
  campaign text,
  amount numeric not null default 0,
  spend_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists leads_tenant_retirement_score_idx
on public.leads (tenant_id, retirement_score desc, created_at desc);

create index if not exists leads_tenant_assigned_advisor_idx
on public.leads (tenant_id, assigned_advisor_id);

create index if not exists advisors_tenant_accepting_idx
on public.advisors (tenant_id, accepting_leads);

create index if not exists ad_spend_tenant_source_campaign_idx
on public.ad_spend (tenant_id, source, campaign);

alter table public.advisors enable row level security;
alter table public.ad_spend enable row level security;

drop policy if exists "tenant isolated advisors" on public.advisors;
create policy "tenant isolated advisors"
on public.advisors for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated ad spend" on public.ad_spend;
create policy "tenant isolated ad spend"
on public.ad_spend for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

grant select, insert, update, delete on public.advisors to service_role;
grant select, insert, update, delete on public.ad_spend to service_role;

insert into public.tenants (id, slug, name, primary_domain)
values (
  '55555555-5555-4555-8555-555555555555',
  'retire-ready-mn',
  'RetireReadyMN',
  'retirereadymn.com'
)
on conflict (slug) do update
set name = excluded.name,
    primary_domain = excluded.primary_domain;
