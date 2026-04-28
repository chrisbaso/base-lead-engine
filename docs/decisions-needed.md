# Decisions Needed

## Phase 1 Defaults

- **Admin Supabase access model:** Defaulted to service-role reads in future admin data loaders, gated by Clerk allowlist. This preserves tenant RLS for public funnel paths while letting the owner dashboard span tenants.
- **Tenant claim strategy:** Defaulted to `request.jwt.claims.tenant_id` for RLS. If Clerk JWT templates are used, add the active tenant ID claim there.
- **Next.js version:** Requirement says Next.js 15. Pinned `next@15.5.7`, the patched 15.x line documented as safe for App Router deployments.
