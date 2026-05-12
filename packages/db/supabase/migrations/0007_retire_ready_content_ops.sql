create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  topic text not null,
  category text not null,
  status text not null default 'new',
  priority text not null default 'medium',
  target_keyword text,
  source_prompt text,
  notes text,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  idea_id uuid references public.content_ideas(id) on delete set null,
  slug text not null,
  title text not null,
  description text not null default '',
  category text not null,
  status text not null default 'draft',
  author_type text not null default 'ai-assisted',
  reviewed_by text not null default 'unreviewed',
  compliance_status text not null default 'pending',
  body_mdx text not null default '',
  frontmatter jsonb not null default '{}'::jsonb,
  source_links jsonb not null default '[]'::jsonb,
  cta_variant text not null default 'score-checkup-educational',
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.content_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  draft_id uuid references public.content_drafts(id) on delete set null,
  reviewer text not null,
  status text not null default 'pending',
  checklist jsonb not null default '{}'::jsonb,
  notes text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.content_publications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  draft_id uuid references public.content_drafts(id) on delete set null,
  slug text not null,
  title text not null,
  description text not null default '',
  category text not null,
  status text not null default 'published',
  canonical_url text,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  draft_id uuid references public.content_drafts(id) on delete set null,
  publication_id uuid references public.content_publications(id) on delete set null,
  channel text not null,
  status text not null default 'draft',
  copy text not null,
  scheduled_for timestamptz,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  run_type text not null,
  agent_name text not null,
  status text not null default 'queued',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.compliance_flags (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  draft_id uuid references public.content_drafts(id) on delete set null,
  review_id uuid references public.content_reviews(id) on delete set null,
  severity text not null default 'blocking',
  flag_type text not null,
  message text not null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.content_performance (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  draft_id uuid references public.content_drafts(id) on delete set null,
  slug text not null,
  views integer not null default 0,
  cta_clicks integer not null default 0,
  quiz_starts integer not null default 0,
  lead_captures integer not null default 0,
  phone_captures integer not null default 0,
  advisor_assignments integer not null default 0,
  last_event_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug)
);

create index if not exists content_ideas_tenant_status_idx
on public.content_ideas (tenant_id, status, created_at desc);

create index if not exists content_drafts_tenant_status_idx
on public.content_drafts (tenant_id, status, updated_at desc);

create index if not exists content_reviews_tenant_status_idx
on public.content_reviews (tenant_id, status, created_at desc);

create index if not exists content_publications_tenant_status_idx
on public.content_publications (tenant_id, status, published_at desc);

create index if not exists social_posts_tenant_channel_status_idx
on public.social_posts (tenant_id, channel, status, scheduled_for);

create index if not exists agent_runs_tenant_status_idx
on public.agent_runs (tenant_id, status, created_at desc);

create index if not exists compliance_flags_tenant_resolved_idx
on public.compliance_flags (tenant_id, resolved_at, created_at desc);

create index if not exists content_performance_tenant_slug_idx
on public.content_performance (tenant_id, slug);

alter table public.content_ideas enable row level security;
alter table public.content_drafts enable row level security;
alter table public.content_reviews enable row level security;
alter table public.content_publications enable row level security;
alter table public.social_posts enable row level security;
alter table public.agent_runs enable row level security;
alter table public.compliance_flags enable row level security;
alter table public.content_performance enable row level security;

drop policy if exists "tenant isolated content ideas" on public.content_ideas;
create policy "tenant isolated content ideas"
on public.content_ideas for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated content drafts" on public.content_drafts;
create policy "tenant isolated content drafts"
on public.content_drafts for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated content reviews" on public.content_reviews;
create policy "tenant isolated content reviews"
on public.content_reviews for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated content publications" on public.content_publications;
create policy "tenant isolated content publications"
on public.content_publications for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated social posts" on public.social_posts;
create policy "tenant isolated social posts"
on public.social_posts for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated agent runs" on public.agent_runs;
create policy "tenant isolated agent runs"
on public.agent_runs for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated compliance flags" on public.compliance_flags;
create policy "tenant isolated compliance flags"
on public.compliance_flags for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

drop policy if exists "tenant isolated content performance" on public.content_performance;
create policy "tenant isolated content performance"
on public.content_performance for all
using (tenant_id = public.current_tenant_id())
with check (tenant_id = public.current_tenant_id());

grant select, insert, update, delete on public.content_ideas to service_role;
grant select, insert, update, delete on public.content_drafts to service_role;
grant select, insert, update, delete on public.content_reviews to service_role;
grant select, insert, update, delete on public.content_publications to service_role;
grant select, insert, update, delete on public.social_posts to service_role;
grant select, insert, update, delete on public.agent_runs to service_role;
grant select, insert, update, delete on public.compliance_flags to service_role;
grant select, insert, update, delete on public.content_performance to service_role;

insert into public.content_drafts (
  tenant_id,
  slug,
  title,
  description,
  category,
  status,
  author_type,
  reviewed_by,
  compliance_status,
  source_links,
  cta_variant,
  word_count
)
values (
  '55555555-5555-4555-8555-555555555555',
  'draft-minnesota-retirement-income-audit',
  'Minnesota Retirement Income Audit Questions',
  'A draft checklist concept for reviewing retirement income gaps, taxes, healthcare, and market risk before publication.',
  'Retirement Income Planning',
  'draft',
  'ai-assisted',
  'unreviewed',
  'pending',
  '["https://www.consumerfinance.gov/consumer-tools/retirement/", "https://www.investor.gov/"]'::jsonb,
  'score-checkup-educational',
  39
)
on conflict (tenant_id, slug) do update
set title = excluded.title,
    description = excluded.description,
    category = excluded.category,
    status = excluded.status,
    author_type = excluded.author_type,
    reviewed_by = excluded.reviewed_by,
    compliance_status = excluded.compliance_status,
    source_links = excluded.source_links,
    cta_variant = excluded.cta_variant,
    word_count = excluded.word_count,
    updated_at = now();

insert into public.content_publications (
  tenant_id,
  slug,
  title,
  category,
  status,
  published_at,
  updated_at,
  metadata
)
values
  ('55555555-5555-4555-8555-555555555555', 'when-to-claim-social-security-in-minnesota', 'When Should Minnesotans Claim Social Security?', 'Social Security', 'published', '2026-05-01', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'social-security-67-vs-70', 'Social Security at 67 vs 70', 'Social Security', 'published', '2026-05-02', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'retirement-income-score-explained', 'What Your Retirement Income Score Means', 'Retirement Income Planning', 'published', '2026-05-03', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'building-a-minnesota-retirement-paycheck', 'Building a Minnesota Retirement Paycheck', 'Retirement Income Planning', 'published', '2026-05-04', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'minnesota-retiree-tax-checklist', 'Minnesota Retiree Tax Checklist', 'Minnesota Taxes', 'published', '2026-05-05', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'roth-conversions-before-rmds', 'Roth Conversions Before RMDs', 'Minnesota Taxes', 'published', '2026-05-06', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'sequence-risk-first-five-years', 'Sequence Risk in the First Five Years', 'Market Risk', 'published', '2026-05-07', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'market-crash-retirement-income-plan', 'What a Market Crash Does to Retirement Income', 'Market Risk', 'published', '2026-05-08', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'annuities-without-the-sales-pitch', 'Annuities Without the Sales Pitch', 'Annuities Explained', 'published', '2026-05-09', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'guaranteed-income-retirement-math', 'How Guaranteed Income Changes Retirement Math', 'Annuities Explained', 'published', '2026-05-10', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'healthcare-costs-before-medicare', 'Healthcare Costs Before Medicare', 'Healthcare Costs', 'published', '2026-05-11', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb),
  ('55555555-5555-4555-8555-555555555555', 'medicare-and-retirement-income', 'Medicare and Retirement Income Planning', 'Healthcare Costs', 'published', '2026-05-12', '2026-05-12', '{"cta_variant":"score-checkup-educational"}'::jsonb)
on conflict (tenant_id, slug) do update
set title = excluded.title,
    category = excluded.category,
    status = excluded.status,
    published_at = excluded.published_at,
    updated_at = excluded.updated_at,
    metadata = excluded.metadata;
