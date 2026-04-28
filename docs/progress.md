# Progress

## Phase 1 - Foundation

Built:
- Created the pnpm workspace and Turborepo task graph.
- Added `apps/web` and `apps/admin` as Next.js App Router apps.
- Added strict TypeScript, ESLint, Vitest, and CI wiring.
- Added `packages/core`, `packages/db`, `packages/ui`, tenant schema, and the `demo` tenant.
- Added the initial Supabase migration with tenant-scoped tables and RLS policies.
- Added hostname-to-tenant resolution and runtime tenant config validation.

Skipped:
- Live Supabase verification because no project credentials are present in this fresh workspace.
- Full Clerk auth UI in the admin app; Phase 1 only wires the app shell and dependency.

Risks:
- RLS policies assume JWTs include a `tenant_id` claim. Admin/service workflows will need explicit service-role paths plus application-level authorization.
- Next.js is pinned to the latest patched 15.x line to honor the requested stack while avoiding known App Router security issues.

Review when back:
- Confirm the tenant JWT claim strategy before production Supabase policies are frozen.
- Confirm whether admin reads should use a service role with Clerk email allowlisting or tenant-scoped user claims.

## Phase 2 - Lead Capture + Tracking

Built:
- Added schema-driven lead capture primitives for quiz, calculator, multi-step form, and single form flows.
- Updated the demo tenant to a working three-step quiz with partial-save email capture and localStorage persistence.
- Added a Server Action submission path that validates tenant-defined fields, upserts Supabase leads, records lead events, and emits downstream tracking.
- Added tracking config and fanout for GTM, Meta CAPI, Google Enhanced Conversions endpoint delivery, plus client pixel fallbacks.
- Added tests for tenant field validation, tracking config exposure, and the lead submission pipeline.

Skipped:
- Live Supabase, Meta, and Google API verification because real credentials are not present in the workspace.

Risks:
- Google Enhanced Conversions is represented as a tenant-configurable server endpoint until the production Google Ads OAuth/service account strategy is confirmed.
- Demo partial-save currently upserts by tenant and email once email exists; anonymous pre-email partials are not persisted.

Review when back:
- Provide staging Supabase, Meta access token, and Google Ads server-side conversion credentials.
- Confirm whether anonymous partial submissions should create leads before email capture.
