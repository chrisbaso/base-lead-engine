# Base Lead Engine

Reusable multi-tenant lead generation and automation chassis for launching tenant-specific funnels from shared code.

## Quickstart

```bash
corepack enable
pnpm install
pnpm dev
```

The demo funnel runs from `apps/web` on port `3000`. The admin shell runs from `apps/admin` on port `3001`.

Copy `.env.example` to `.env.local` inside each app or configure the same variables in Vercel. Local development can build with placeholders, but live Supabase, Resend, HubSpot, Clerk, tracking, Turnstile, Upstash, and Sentry behavior requires real credentials.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Layout

- `apps/web` - tenant funnel app deployed once per tenant with `TENANT_SLUG`.
- `apps/admin` - admin dashboard for all tenants.
- `packages/core` - shared business logic.
- `packages/db` - Supabase client and migrations.
- `packages/tenants` - tenant config schema and tenant implementations.
- `packages/ui` - shared UI utilities and components.

## Docs

- `docs/architecture.md` - system shape, data flow, and key decisions.
- `docs/launch-new-tenant.md` - tenant launch playbook.
- `docs/operations.md` - production debugging runbook.
- `docs/progress.md` - phase-by-phase implementation notes.
- `docs/decisions-needed.md` - defaults and unresolved items to review.

## Deploying A Tenant

Create one Vercel project per tenant from this monorepo, target `apps/web`, and set `TENANT_SLUG=<slug>`. Add the tenant domain after the preview deployment passes the checklist in `docs/launch-new-tenant.md`.
