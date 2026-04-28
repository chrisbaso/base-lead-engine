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
