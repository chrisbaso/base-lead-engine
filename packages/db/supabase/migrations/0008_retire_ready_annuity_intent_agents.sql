alter table public.leads
add column if not exists income_preference text,
add column if not exists annuity_intent_score integer,
add column if not exists annuity_intent_band text,
add column if not exists annuity_intent_segment text,
add column if not exists annuity_intent_reasons jsonb not null default '[]'::jsonb,
add column if not exists automation_priority text,
add column if not exists recommended_action text,
add column if not exists next_best_email_id text;

create table if not exists public.lead_intelligence (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  summary text not null default '',
  intent_score integer not null default 0,
  intent_band text not null default 'Low',
  intent_segment text not null default 'education_only',
  urgency text not null default 'normal',
  automation_priority text not null default 'standard',
  recommended_next_action text not null default 'continue_nurture',
  next_best_email_id text,
  signals jsonb not null default '{}'::jsonb,
  missing_fields jsonb not null default '[]'::jsonb,
  risk_flags jsonb not null default '[]'::jsonb,
  advisor_talking_points jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, lead_id)
);

create table if not exists public.advisor_routing_recommendations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  advisor_id uuid not null references public.advisors(id) on delete cascade,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  rank integer not null default 1,
  score integer not null default 0,
  rationale text not null default '',
  reasons jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  decided_at timestamptz,
  decided_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists leads_tenant_annuity_intent_idx
on public.leads (tenant_id, annuity_intent_score desc, automation_priority, created_at desc);

create index if not exists lead_intelligence_tenant_priority_idx
on public.lead_intelligence (tenant_id, automation_priority, intent_score desc, updated_at desc);

create index if not exists lead_intelligence_tenant_action_idx
on public.lead_intelligence (tenant_id, recommended_next_action, updated_at desc);

create index if not exists advisor_routing_tenant_status_idx
on public.advisor_routing_recommendations (tenant_id, status, score desc, created_at desc);

create index if not exists advisor_routing_tenant_lead_idx
on public.advisor_routing_recommendations (tenant_id, lead_id, rank);

alter table public.lead_intelligence enable row level security;
alter table public.advisor_routing_recommendations enable row level security;

drop policy if exists "tenant isolated lead intelligence" on public.lead_intelligence;
create policy "tenant isolated lead intelligence"
on public.lead_intelligence for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated advisor routing recommendations" on public.advisor_routing_recommendations;
create policy "tenant isolated advisor routing recommendations"
on public.advisor_routing_recommendations for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

grant select, insert, update, delete on public.lead_intelligence to service_role;
grant select, insert, update, delete on public.advisor_routing_recommendations to service_role;
