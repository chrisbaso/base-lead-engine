alter table public.leads
add column if not exists quiz_variant text,
add column if not exists email_variant text;

alter table public.email_sends
add column if not exists variant_id text;

create index if not exists leads_tenant_quiz_variant_idx
on public.leads (tenant_id, quiz_variant);

create index if not exists leads_tenant_email_variant_idx
on public.leads (tenant_id, email_variant);

create index if not exists email_sends_tenant_variant_idx
on public.email_sends (tenant_id, variant_id);

grant select, insert, update, delete on public.events to service_role;
grant select, insert, update, delete on public.leads to service_role;
grant select, insert, update, delete on public.email_sends to service_role;
