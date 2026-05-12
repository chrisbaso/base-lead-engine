insert into public.tenants (id, slug, name, primary_domain)
values (
  '33333333-3333-4333-8333-333333333333',
  'smart-retirement-mn',
  'Smart Retirement MN',
  'smartretirementmn.com'
)
on conflict (slug) do update
set name = excluded.name,
    primary_domain = excluded.primary_domain;
