# Full Codebase Audit — base-lead-engine

**Date:** 2026-06-11  
**Scope:** Multi-tenant lead-generation monorepo (Next.js 15.5, React 19, TypeScript, pnpm, Turborepo, Supabase)  
**Production context:** Retirement-income lead funnel; data isolation and reliability are top priorities.

---

## Severity Legend

| Severity | Meaning |
|----------|---------|
| 🔴 CRITICAL | Active data-isolation or security breach possible |
| 🟠 HIGH | Reliability failure or data loss in production |
| 🟡 MEDIUM | Correctness issue or meaningful security gap |
| 🟢 LOW | Code quality, coverage, or DX concern |

---

## 1. RLS Audit

### 🔴 CRITICAL — Resend Webhook Tenant Spoofing Bypasses RLS Entirely

**File:** `apps/web/app/api/webhooks/resend/route.ts`

The tenant is resolved from an **unsigned query parameter** (`?tenant=<slug>`). Any caller — including an attacker — can POST to `/api/webhooks/resend?tenant=retirement` and mark arbitrary emails as bounced or opened for the retirement tenant, then trigger `suppressEmail()` which uses the **service-role client** (RLS bypassed). There is no Resend webhook signature verification.

```
// Current (insecure)
const tenantSlug = url.searchParams.get("tenant") ?? process.env.TENANT_SLUG ?? "demo";
```

Impact: an attacker can suppress the email address of any lead in any tenant, preventing all future email delivery. They can also mark any email as clicked/opened, inflating analytics.

No mitigation exists in the current code.

### 🔴 CRITICAL — Service-Role Client Used in `submitLeadAction` Without Explicit Tenant Guard

**File:** `apps/web/app/actions.ts`

`submitLeadAction()` uses the service-role client throughout. Tenant isolation depends entirely on `resolveTenant()` succeeding and returning the correct config. If `resolveTenant()` falls through to a wrong tenant (e.g., hostname misconfig), all writes — leads, events, email schedules, CRM sync — land in the wrong tenant's partition.

RLS is supposed to be the safety net, but the service-role client bypasses it. There is no secondary assertion (e.g., checking `leads.tenant_id === resolvedTenant.id` after upsert).

### 🟠 HIGH — Admin Queries Are Cross-Tenant Without Access Control

**File:** `apps/admin/app/data.ts`

`getAdminOverview()`, `getLeadRows()`, `getLeadTimeline()`, `getFunnelStats()`, and `getEmailSendStats()` all accept a `tenantSlug` URL parameter. Clerk only validates a single `CLERK_ADMIN_EMAIL` — it does **not** validate that the authenticated user is allowed to see the requested tenant. Any user matching the admin email can query any tenant's data by changing the URL slug. This is not a multi-user problem today, but it is a boundary violation and will become one if a second admin is ever added.

### 🟠 HIGH — RLS Policy Depends on JWT `tenant_id` Claim — Anon Paths Have No Claim

**File:** `packages/db/supabase/migrations/0001_foundation.sql`

```sql
CREATE OR REPLACE FUNCTION public.current_tenant_id() RETURNS uuid AS $$
  SELECT (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::uuid;
$$ LANGUAGE sql STABLE;
```

The RLS policies on all five tables (`leads`, `lead_events`, `email_sends`, `email_suppressions`, `crm_sync_log`) compare `tenant_id = public.current_tenant_id()`. This function returns `NULL` when no JWT claim is present. In PostgreSQL, `tenant_id = NULL` evaluates to `NULL` (not `TRUE`), so **RLS blocks all rows** rather than leaking them — but it also means any bug that invokes the anon client accidentally will silently return empty result sets rather than raising an error, making data-loss bugs harder to detect.

The service-role client bypasses this entirely. All production writes go through the service-role client, making the RLS policies a defensive layer that is never exercised in practice. If the service-role key were to leak, there is no secondary control.

### 🟡 MEDIUM — No Schema Drift Between Migration and Code Expectations

`0001_foundation.sql` is the only migration. Code column references match the schema exactly — no drift detected. However, the migration has no `DOWN` counterpart, and there is no tooling to detect future drift.

---

## 2. Secrets and Environment Handling

### 🟠 HIGH — `UNSUBSCRIBE_SIGNING_SECRET` Is Optional; Missing It Disables Verification

**File:** `packages/core/src/email-engine/index.ts`

```typescript
// if secret not set, verification always returns true
if (!secret) return true;
```

If `UNSUBSCRIBE_SIGNING_SECRET` is not set in production, **any** crafted unsubscribe URL token is accepted. An attacker who knows a lead's email address can construct a URL that suppresses that address permanently. There is no startup assertion requiring the secret to be present.

### 🟡 MEDIUM — No Environment Validation at Startup

Neither app validates that required environment variables are present and non-empty at boot time. Missing secrets (`SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `CRON_SECRET`) surface only at the moment the relevant code path is first hit in production, not at deploy time. A startup check (e.g., using `zod` or `@t3-oss/env-nextjs`) would catch misconfigured deployments before they serve traffic.

### 🟡 MEDIUM — `NEXT_PUBLIC_` Variables Are Appropriate, But `NEXT_PUBLIC_APP_URL` Is Used to Construct Unsubscribe Links Server-Side

**Files:** `apps/web/next.config.ts`, `packages/core/src/email-engine/templates.ts`

`NEXT_PUBLIC_APP_URL` is exposed to the client bundle (correct for its use in the form). It is also used server-side to build unsubscribe URLs in outbound emails. If an attacker can control `NEXT_PUBLIC_APP_URL` via environment misconfiguration, they can redirect all unsubscribe clicks to an attacker-controlled domain. A separate, server-only `APP_URL` variable should be used for link construction in emails.

### 🟡 MEDIUM — HubSpot Token Read from Dynamic Env Key

**File:** `packages/core/src/crm-sync/index.ts`

```typescript
const token = process.env[tenant.crm.apiKeyEnv];
```

The env var name is stored in the tenant config (`packages/tenants/demo/config.ts`). If a tenant config were tampered with (e.g., via a compromised admin who edits config files), an attacker could point `apiKeyEnv` to a different env var and exfiltrate secrets. All API keys should be retrieved from a fixed map keyed by tenant slug, not by an arbitrary env var name stored in config.

### 🟢 LOW — `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` Are Correctly Public

No concern here — these are designed to be browser-visible.

---

## 3. Email Queue

### 🟠 HIGH — Failed Email Sends Are Silently Dropped (No Retry)

**File:** `packages/core/src/email-engine/index.ts` — `runDueEmailSends()`

When a Resend API call fails, the send row is updated to `status='skipped'` with the error text. There is no retry mechanism, no exponential backoff, and no dead-letter queue status (compare: `crm_sync_log` has a proper `dead_letter` status and 4-attempt backoff). A transient Resend outage, rate-limit burst, or network timeout will permanently drop emails with no operator alert.

### 🟠 HIGH — Email Cron Processes All Tenants in One Pass Without Idempotency Lock

**File:** `apps/web/app/api/cron/email/route.ts`

The cron fetches up to 50 pending rows across **all tenants** with no distributed lock. If the cron is invoked twice concurrently (e.g., a Vercel cron overlapping with a manual trigger), both invocations can read the same `pending` rows before either updates them to `sent`, resulting in duplicate email delivery. The `email_sends` table has no `status = 'in_progress'` state or advisory lock.

### 🟡 MEDIUM — Resend Webhook Has No Signature Verification

*(Also raised in §1.)* Beyond the tenant-spoofing angle, the missing signature check means anyone can POST fake bounce events, causing legitimate addresses to be suppressed. Resend provides a `Resend-Signature` header; verifying it with the configured webhook secret would close this vector.

### 🟡 MEDIUM — Unsubscribe Is Tenant-Scoped but Suppression Is Per-Tenant Email

**Files:** `apps/web/app/unsubscribe/page.tsx`, `packages/core/src/email-engine/index.ts`

A lead who unsubscribes from one tenant's emails is only suppressed in `email_suppressions` for that tenant. If the same email address appears as a lead for a second tenant, they will receive emails from the second tenant. For a single-funnel deployment this is fine, but the current schema allows it and does not document this behavior. CAN-SPAM compliance requires honoring unsubscribes per sender, so the current per-tenant model is legally sufficient — but it must be documented so future tenant additions don't violate it.

### 🟡 MEDIUM — No Rate-Limit on Resend API Calls in `runDueEmailSends`

The cron processes up to 50 emails per invocation and calls the Resend API once per email with no per-second throttle. Resend's free and paid tiers have rate limits. A burst of 50 sends can trigger a 429, which is logged and the row is skipped — no retry.

### 🟢 LOW — Email Sequence Scheduling Is Correct but Not Idempotent

`scheduleEmailSequence()` does a plain `insert` (not upsert) into `email_sends`. If `submitLeadAction` is called twice for the same lead (e.g., form re-submission), a duplicate sequence is inserted. The `leads` table upserts correctly but the email side does not deduplicate.

---

## 4. HubSpot Sync

### 🟠 HIGH — Partial Failure Leaves Contact/Deal in Inconsistent State

**File:** `packages/core/src/crm-sync/index.ts` — `runHubSpotSync()`

The sync creates a contact, then conditionally creates a deal and associates it, then optionally adds to a list. Each step makes a separate HTTP call. There is no rollback. If contact creation succeeds but deal creation fails (e.g., invalid pipeline ID), the retry will attempt to create the contact again via the same `createContact()` path. HubSpot deduplicates on email, so the contact creation will succeed (return the existing contact), but the original failure reason may be permanent (bad config), causing repeated `retry` cycles before `dead_letter`. The inconsistent state is never cleaned up.

### 🟠 HIGH — Sync Errors Are Not Surfaced to Operators

**Files:** `packages/core/src/crm-sync/index.ts`, `apps/web/app/api/cron/crm/route.ts`

CRM sync errors are stored in `crm_sync_log.error` and eventually transition to `dead_letter`, but there is no alert, Slack notification, or Sentry capture when a record hits `dead_letter`. The notifications system is wired for high-score leads but not for infrastructure failures. An operator must actively query the database to discover sync failures.

### 🟡 MEDIUM — Hardcoded HubSpot Association Type IDs

**File:** `packages/core/src/crm-sync/index.ts`

```typescript
// association typeId: 3 = deal-to-contact, 202 = note-to-contact
```

HubSpot association type IDs are portal-specific for custom object types but fixed for standard objects. IDs 3 and 202 are correct for standard HubSpot portals, but this is undocumented and brittle. If HubSpot changes these (they have before), syncs will fail silently with a 4xx response that is treated as a permanent error.

### 🟡 MEDIUM — `createContact` vs `updateContact` Always Creates; Update Path Is Unused

**File:** `packages/core/src/crm-sync/index.ts`

`runHubSpotSync()` only calls `createContact()`. The `updateContact()` method is implemented in the adapter but never called. If a contact already exists in HubSpot (prior import, duplicate campaign), `createContact` will return a 409 conflict. The code does not handle 409 to fall through to `updateContact`. This will cause repeated retries until `dead_letter` for any lead whose email already exists in HubSpot.

### 🟡 MEDIUM — All Field Values Coerced to String

HubSpot number and date properties sent as strings may fail validation on the HubSpot side or be stored as text. The retirement tenant sends `age` and `retirement_savings` which are numeric fields — sending them as `"65"` may work but is fragile.

---

## 5. Lead Scoring

### 🟡 MEDIUM — Scoring Rules Are Duplicated Between Config and Runtime

**Files:** `packages/tenants/retirement/scoring.ts`, `packages/tenants/retirement/config.ts`

The retirement tenant imports `retirementScoringRules` from `scoring.ts` and spreads it into `config.ts`. This is correctly single-sourced. No duplication was found in this repo at review time. However, the demo tenant inline-defines its rules inside `config.ts` with no separate file, while retirement externalizes them — inconsistent pattern that will lead to drift as tenants multiply.

### 🟡 MEDIUM — Score Is Not Recomputed When Lead Fields Update

**File:** `packages/core/src/lead-capture/pipeline.ts`

`submitLead()` computes score once and upserts it. If a returning user re-submits the form with updated information (e.g., corrected retirement savings), the `score` column is updated by the upsert. This is correct. However, if scoring **rules** change (config file updated), existing leads' scores in the database are stale — there is no backfill mechanism. Rule changes silently apply only to new submissions.

### 🟢 LOW — `'contains'` Operator with Empty String Always Matches

**File:** `packages/core/src/lead-scoring/index.ts`

```typescript
case 'contains':
  return String(value).includes(String(rule.value));
```

The demo tenant has a rule `company contains ""` which always returns true (any string contains the empty string). This awards +10 points to every lead regardless of whether they provided a company name. The intent was likely to check that the field is non-empty. A `notEquals ''` or `exists` operator would be semantically correct.

### 🟢 LOW — No Score Floor/Ceiling Validation

The scoring engine can return a negative score or a score above any documented maximum. No validation enforces a `[0, 100]` range. This is cosmetic now but could confuse future rules authors.

---

## 6. Next.js 15 / React 19 Correctness

### 🟠 HIGH — Server Component Data Fetch Has No `cache: 'no-store'` — Cross-Tenant Cache Leak Risk

**Files:** `apps/web/app/page.tsx`, `apps/admin/app/page.tsx`, all admin page files

The admin and web app use async Server Components that call data-fetching functions directly. These functions use the Supabase JS client which makes `fetch` calls internally. Next.js 15 defaults to `no-store` for `fetch` in Server Components in dynamic routes, but the admin pages are **static routes** (no dynamic segment). If Next.js caches a Supabase response for one tenant's slug and serves it to another slug request within the same cache TTL, data leaks across tenants.

In practice, the admin app uses `?tenant=<slug>` as a search param (which Next.js treats as dynamic), and the web app is single-tenant per deployment — so the risk is theoretical rather than active. But there are no explicit `cache: 'no-store'` or `revalidate = 0` declarations in any data-fetching path. This should be made explicit.

### 🟡 MEDIUM — Server Action `submitLeadAction` Uses `headers()` — Correct in Next.js 15

**File:** `apps/web/app/actions.ts`

`headers()` is correctly awaited in Next.js 15 (`const h = await headers()`). No issue here. The action is marked `"use server"` and lives in a server-only file.

### 🟡 MEDIUM — Client Component Imports Server-Only Package Transitively

**File:** `apps/web/app/lead-capture-client.tsx`

`LeadCaptureClient` imports from `@ble/core/lead-capture/components` which is a client component. That package imports `zod` and tenant configs. The tenant config packages (`@ble/tenant-demo`, `@ble/tenant-retirement`) should not include secrets, and inspection confirms they don't — but as the tenant package grows, a developer could accidentally add a server-only import. There is no `server-only` guard on the tenant packages.

### 🟢 LOW — `"use client"` Components Correctly Isolated

All interactive form components (`Quiz`, `Calculator`, `MultiStepForm`, `SingleForm`) are correctly marked `"use client"`. Server Components wrap them correctly. No server/client boundary violations detected.

---

## 7. Monorepo Health

### 🟡 MEDIUM — No Turborepo `inputs` Defined for Test and Build Tasks

**File:** `turbo.json` (inferred from package.json scripts)

Without explicit `inputs` on the `test` and `build` pipeline tasks, Turborepo cannot granularly cache — it will either over-invalidate or under-invalidate. The `packages/tenants/*` packages have no tests, so they never invalidate the test cache even when their configs change, potentially masking regressions in tenant-specific logic.

### 🟡 MEDIUM — `retry` Utility in `packages/core/src/retry/index.ts` Is Only Used for HubSpot

The `fetchWithRetry()` exponential backoff utility exists in core but is **not** used by the email engine (Resend calls are plain `fetch`), not used by tracking (Meta CAPI, Google), and not used by the bot-protection check (Turnstile). This creates inconsistent reliability characteristics across outbound HTTP calls.

### 🟢 LOW — `@ble/ui` Package Is Nearly Empty

`packages/ui` exports minimal shared components. Both apps independently implement their own layout shells. If a third funnel app is added, UI primitives will be duplicated. Not a current problem but worth noting.

### 🟢 LOW — No `.env.example` Validation in CI

The `.env.example` file documents required variables, but there is no CI step that checks all required vars are declared. A new required variable added to code without updating `.env.example` will not be caught until production deployment.

---

## 8. Test Coverage on Money Paths

### 🟠 HIGH — No Test for Email Send Execution or Retry Behavior

`runDueEmailSends()` is the most critical reliability function and has **zero test coverage**. There is no test for: successful Resend call, Resend 429/500 handling, suppressed-address skip, or the pending→sent/skipped state transitions.

### 🟠 HIGH — No Test for CRM Sync Execution

`runDueCrmSync()` and the HubSpot adapter (`createContact`, `updateContact`, `createDeal`) have zero test coverage. The only test for CRM is `enqueueCrmSync()` which verifies a row is inserted — the actual sync execution is untested.

### 🟡 MEDIUM — No Test for Resend Webhook Handler

`handleResendWebhook()` is untested. No coverage of bounce → suppression path, the (missing) signature verification, or tenant routing.

### 🟡 MEDIUM — No Test for Cron Route Auth (`CRON_SECRET` Check)

The `Authorization: Bearer` verification in both cron routes is untested. A regression here could open the routes to unauthenticated callers.

### 🟡 MEDIUM — No Integration Test for Full Lead Capture → Email → CRM Pipeline

`pipeline.test.ts` exercises `submitLead()` with a mocked Supabase client and verifies 4 table inserts. It does not verify: email template rendering with lead data, CRM field mapping correctness, score-based email condition filtering, or notification dispatch.

### 🟡 MEDIUM — Rate Limiting and Bot Protection Are Untested

`enforceRateLimit()` and `verifyTurnstileToken()` have no tests. The in-memory fallback rate limiter is not tested for its concurrency behavior.

### 🟢 LOW — Tracking Emission Is Tested Only for Config Exposure

`tracking/index.test.ts` verifies that client pixel config is exposed correctly, but does not test that the actual Meta CAPI or Google Enhanced Conversions HTTP calls are made (or fail gracefully).

---

## Summary Table

| # | Finding | Severity | Area |
|---|---------|----------|------|
| 1 | Resend webhook tenant spoofable via unsigned query param | 🔴 CRITICAL | RLS / Security |
| 2 | `submitLeadAction` service-role with no secondary tenant assertion | 🔴 CRITICAL | RLS |
| 3 | Admin tenant access has no per-user authorization | 🟠 HIGH | RLS / Auth |
| 4 | `UNSUBSCRIBE_SIGNING_SECRET` optional — disables token verification | 🟠 HIGH | Secrets |
| 5 | Failed email sends silently dropped, no retry | 🟠 HIGH | Email Queue |
| 6 | Email cron not idempotent — duplicate sends under concurrent invocation | 🟠 HIGH | Email Queue |
| 7 | HubSpot partial failure leaves inconsistent state | 🟠 HIGH | HubSpot Sync |
| 8 | CRM dead-letter events generate no operator alert | 🟠 HIGH | HubSpot Sync |
| 9 | No `cache: 'no-store'` on Server Component data fetches | 🟠 HIGH | Next.js 15 |
| 10 | `runDueEmailSends` has zero test coverage | 🟠 HIGH | Testing |
| 11 | HubSpot adapter has zero test coverage | 🟠 HIGH | Testing |
| 12 | No startup env validation | 🟡 MEDIUM | Secrets |
| 13 | `NEXT_PUBLIC_APP_URL` used server-side for link construction | 🟡 MEDIUM | Secrets |
| 14 | HubSpot token from dynamic env key name | 🟡 MEDIUM | Secrets |
| 15 | No Resend webhook signature verification | 🟡 MEDIUM | Email Queue |
| 16 | Email sequence schedule not idempotent on re-submit | 🟡 MEDIUM | Email Queue |
| 17 | `createContact` 409 not handled; `updateContact` never called | 🟡 MEDIUM | HubSpot Sync |
| 18 | Hardcoded HubSpot association type IDs | 🟡 MEDIUM | HubSpot Sync |
| 19 | Score not backfilled when rules change | 🟡 MEDIUM | Lead Scoring |
| 20 | `contains ''` rule always matches — demo tenant scoring bug | 🟢 LOW | Lead Scoring |
| 21 | Webhook handler untested | 🟡 MEDIUM | Testing |
| 22 | Cron auth untested | 🟡 MEDIUM | Testing |
| 23 | No full pipeline integration test | 🟡 MEDIUM | Testing |
| 24 | `fetchWithRetry` not used by email/tracking paths | 🟡 MEDIUM | Monorepo |
| 25 | Inconsistent scoring rule file structure across tenants | 🟢 LOW | Lead Scoring |
