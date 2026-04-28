# Architecture

Base Lead Engine is a pnpm/Turborepo monorepo for launching tenant-specific lead funnels without writing new funnel code for standard quiz, calculator, and form offers.

## System Shape

```mermaid
flowchart LR
  visitor["Visitor browser"] --> web["apps/web tenant deployment"]
  web --> action["Server Action submitLeadAction"]
  action --> core["packages/core pipeline"]
  core --> db["Supabase Postgres with tenant_id + RLS"]
  core --> tracking["Meta CAPI + Google Enhanced Conversions"]
  core --> email["Email queue + Resend cron"]
  core --> crm["CRM queue + HubSpot cron"]
  admin["apps/admin Clerk-protected dashboard"] --> db
```

## Tenant Model

- Each tenant gets one Vercel project for `apps/web`.
- The deployment sets `TENANT_SLUG=<slug>`.
- Tenant config lives in `packages/tenants/<slug>/config.ts` and is validated by the Zod schema in `packages/tenants/_schema`.
- Public funnel routing can also resolve a tenant by hostname through `apps/web/middleware.ts`.
- Every database table includes `tenant_id`; application queries write it explicitly and Supabase RLS is the safety net.

## Lead Lifecycle

```mermaid
sequenceDiagram
  participant B as Browser
  participant W as Web App
  participant C as Core Pipeline
  participant S as Supabase
  participant T as Tracking APIs
  participant E as Email Queue
  participant H as HubSpot Queue

  B->>W: Submit step or final form
  W->>C: submitLeadAction
  C->>C: Rate limit + Turnstile
  C->>C: Validate tenant fields + score lead
  C->>S: Upsert lead + insert lead_event
  C->>T: Emit server-side tracking with event_id
  C->>E: Schedule eligible sequence emails
  C->>H: Enqueue CRM sync
```

## Key Decisions

- Server-side tracking is primary; client pixels are fallback and dedupe through `event_id`.
- Email and CRM work are queue-based through Supabase tables and Vercel Cron routes.
- External HTTP calls use a shared retry wrapper for 429 and 5xx responses.
- Admin auth is Clerk with a single configured email allowlist for the MVP.
- Production rate limiting uses Upstash Redis REST; local development falls back to in-memory counters.
