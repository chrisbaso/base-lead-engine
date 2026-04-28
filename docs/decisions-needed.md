# Decisions Needed

## Phase 1 Defaults

- **Admin Supabase access model:** Defaulted to service-role reads in future admin data loaders, gated by Clerk allowlist. This preserves tenant RLS for public funnel paths while letting the owner dashboard span tenants.
- **Tenant claim strategy:** Defaulted to `request.jwt.claims.tenant_id` for RLS. If Clerk JWT templates are used, add the active tenant ID claim there.
- **Next.js version:** Requirement says Next.js 15. Pinned `next@15.5.7`, the patched 15.x line documented as safe for App Router deployments.

## Environment Blockers

- **Git push remote missing**
  - Command blocked: `git push`
  - Why it was needed: the autonomy directive asks for periodic GitHub pushes during long-running work.
  - Workaround used: commits are being created locally; push is skipped until a remote is configured with `git remote add`.

## Phase 2 Defaults

- **Google Enhanced Conversions transport:** Defaulted to a tenant-configurable HTTPS endpoint because no Google Ads API OAuth/client credential strategy exists in the workspace. The interface is isolated in `packages/core/src/tracking/index.ts` so it can be swapped for direct Google Ads API calls once credentials and account shape are known.
- **Pre-email partial leads:** Defaulted to localStorage only until an email is captured. This avoids creating anonymous database rows that cannot be nurtured or deduplicated.
