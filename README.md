# Base Lead Engine

Reusable multi-tenant lead generation and automation chassis.

## Quickstart

```bash
corepack enable
pnpm install
pnpm dev
```

The demo funnel runs from `apps/web` on port `3000`. The admin shell runs from `apps/admin` on port `3001`.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
```

## Layout

- `apps/web` - tenant funnel app deployed once per tenant with `TENANT_SLUG`.
- `apps/admin` - admin dashboard for all tenants.
- `packages/core` - shared business logic.
- `packages/db` - Supabase client and migrations.
- `packages/tenants` - tenant config schema and tenant implementations.
- `packages/ui` - shared UI utilities and components.
