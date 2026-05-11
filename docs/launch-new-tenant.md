# Launch A New Tenant

Goal: go from offer idea to live funnel in under four hours without changing shared code.

## 1. Create Tenant Package

1. Copy `packages/tenants/demo` to `packages/tenants/<slug>`.
2. Update package name to `@ble/tenant-<slug>`.
3. Replace `config.ts` values:
   - `identity.tenantId`
   - `identity.slug`
   - tenant name and primary domain
   - branding colors and logo text
   - lead capture copy, steps, fields, and validation
   - tracking IDs and event mappings
   - email domain/from-address/sequences
   - scoring rules and routing thresholds
   - CRM provider, pipeline, stage, list, and property mappings
   - notification email and optional Slack webhook
4. Add the package to any tenant registry imports in `packages/core/src/tenant-config`.

## 2. Configure Supabase

1. Apply migrations from `packages/db/supabase/migrations`.
2. Insert a row in `tenants` with the tenant ID, slug, name, and domain.
3. Confirm RLS is enabled on all tenant tables.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only in Vercel.

## 3. Configure Services

1. Resend: verify sending domain, set SPF/DKIM, and add `RESEND_API_KEY`.
2. HubSpot: create a private app token and set the tenant-specific env var named in `crm.apiKeyEnv`.
3. Tracking: add Meta access token env var, Google Enhanced Conversions endpoint, and client pixel IDs.
4. Hardening: set Upstash, Turnstile, Sentry, and Slack env vars if enabled.
5. Clerk: for admin only, set Clerk keys and `CLERK_ADMIN_EMAIL`.

## 4. Create Vercel Project

1. Create a new Vercel project from this repo.
2. Set the root/build target to `apps/web`.
3. Set `TENANT_SLUG=<slug>`.
4. Add all required shared and tenant-specific env vars.
5. Attach the custom domain after a successful preview deployment.

## 5. Verify Before Traffic

1. Run `pnpm typecheck && pnpm lint && pnpm test`.
2. Run `pnpm build`.
3. Submit a test lead through the tenant funnel.
4. Confirm:
   - lead row exists with correct `tenant_id`
   - lead event row exists
   - tracking server calls succeed or are intentionally skipped
   - first email is scheduled
   - CRM sync row is queued and processed
   - high-score notification fires when threshold is met

## Launching An Advisor Site

Use `packages/tenants/smart-retirement-mn/` as the canonical starting point for a financial advisor website tenant.

1. Copy `packages/tenants/smart-retirement-mn` to `packages/tenants/<advisor-slug>`.
2. Update the package name to `@ble/tenant-<advisor-slug>`.
3. Replace all deploy-blocking placeholders:
   - firm name
   - CRD/IARD number
   - advisor name and title
   - states licensed
   - primary domain
   - BrokerCheck URL
   - Form ADV Part 2A URL
   - privacy policy URL
   - scheduling URL
   - approved advisor photo URL
   - owner notification email
   - from address
4. Update `content`, `compliance`, and `calculator` in `config.ts`.
5. Register the tenant in `packages/core/src/tenant-config/index.ts`.
6. Add a Supabase `tenants` row migration for the new tenant ID.
7. Run the full verification suite and smoke the site with `TENANT_SLUG=<advisor-slug>`.

For the current local build, the advisor calculator is a browser-local experience and does not create leads until the lead wiring is intentionally enabled.
