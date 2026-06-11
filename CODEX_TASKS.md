# Codex Tasks — base-lead-engine

Standalone prompts for a coding agent. Each task is self-contained. Tenant-isolation fixes are listed first regardless of effort. Tasks that change the database schema specify the migration file explicitly.

---

## Task 1 — Verify and Sign Resend Webhooks; Remove Unsigned Tenant Routing

**Priority:** P0 — Tenant isolation / security  
**Estimated effort:** Medium

### Goal

Prevent unauthenticated callers from spoofing Resend webhook events (fake bounces, fake clicks) and from targeting arbitrary tenants via an unsigned query parameter.

### Files Affected

- `apps/web/app/api/webhooks/resend/route.ts`
- `packages/core/src/email-engine/index.ts` (signature helper)
- `.env.example` (new variable: `RESEND_WEBHOOK_SECRET`)

### Approach

1. Add `RESEND_WEBHOOK_SECRET` to `.env.example` and require it at startup.
2. In the route handler, read the raw request body **before** parsing JSON (use `req.text()`, then `JSON.parse`).
3. Verify the `Resend-Signature` header using HMAC-SHA256 over the raw body with `RESEND_WEBHOOK_SECRET`. Reject with 401 if missing or invalid.
4. Remove the `?tenant` query param. Instead, embed the tenant slug into the Resend webhook URL itself as a **path segment** (e.g., `/api/webhooks/resend/[tenantSlug]`). Resolve the tenant from the path, not from caller-supplied query params. The URL is set when you register the webhook in Resend's dashboard — it is not user-supplied at request time.
5. Add a unit test: valid signature passes, tampered body rejects, wrong secret rejects, unknown tenant returns 404.

### Acceptance Criteria

- [ ] `POST /api/webhooks/resend/retirement` with a valid Resend signature updates the correct tenant's `email_sends` row.
- [ ] `POST /api/webhooks/resend/retirement` with no signature returns 401 and makes no database writes.
- [ ] A request with a valid signature but an unknown tenant slug returns 404.
- [ ] Unit tests cover all three cases above.

### Do Not Touch

- `packages/core/src/email-engine/index.ts` logic for `suppressEmail`, `handleResendWebhook` (only add the signature util helper, do not restructure the business logic).
- The `email_suppressions` table schema.
- Any other API routes.

---

## Task 2 — Add Tenant Assertion After Service-Role Writes in `submitLeadAction`

**Priority:** P0 — Tenant isolation  
**Estimated effort:** Small

### Goal

Prevent a misconfigured tenant resolution from writing a lead's data into the wrong tenant's partition. Add a defensive post-write assertion so any mismatch surfaces immediately as an error rather than silently corrupting data.

### Files Affected

- `apps/web/app/actions.ts`
- `packages/core/src/lead-capture/pipeline.ts`

### Approach

1. After `submitLead()` returns the upserted lead row, assert that `lead.tenant_id === resolvedTenant.id`. If they differ, throw an error (which will be caught by the action's error boundary), log via Sentry, and return a generic failure to the user. Do **not** silently continue.
2. In `pipeline.ts`, `submitLead()` already receives `tenantId` as a parameter. Add a runtime check at the top: `if (!tenantId) throw new Error('tenantId required')`.
3. Add a comment explaining why the assertion exists (service-role bypasses RLS; this is the application-layer guard).

### Acceptance Criteria

- [ ] If `resolvedTenant.id` does not match the `tenant_id` on the returned lead row, `submitLeadAction` returns `{ success: false, error: 'Internal error' }` and logs to Sentry.
- [ ] Normal submissions where tenant resolution is correct are unaffected.
- [ ] No additional database queries are introduced; the assertion uses data already in memory.

### Do Not Touch

- The Supabase schema or migrations.
- The RLS policies.
- Any other server actions.

---

## Task 3 — Add Email Send Retry Logic and Dead-Letter Status

**Priority:** P1 — Reliability  
**Estimated effort:** Medium  
**Schema change required:** Yes

### Goal

Failed email sends currently transition to `status='skipped'` permanently. Implement the same exponential-backoff retry pattern that `crm_sync_log` uses: up to 4 retries with `2^n * 5 min` backoff, then `dead_letter`.

### Migration Required

Create `packages/db/supabase/migrations/0002_email_retry.sql`:

```sql
-- Add retry columns to email_sends
ALTER TABLE public.email_sends
  ADD COLUMN IF NOT EXISTS attempts    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_retry_at timestamptz,
  ADD COLUMN IF NOT EXISTS dead_lettered_at timestamptz;

-- Rename 'skipped' status to support retry; the cron will now pick up 'retry' rows
-- Existing 'skipped' rows are intentional permanent skips (suppressed, no template);
-- rename the failed-send terminal state to 'dead_letter' for consistency.
-- No data migration needed; existing 'skipped' rows remain as-is.

-- Update the pending index to also include retry rows due for execution
DROP INDEX IF EXISTS email_sends_pending_idx;
CREATE INDEX email_sends_pending_idx
  ON public.email_sends (scheduled_for)
  WHERE status IN ('pending', 'retry')
    AND (next_retry_at IS NULL OR next_retry_at <= now());
```

### Files Affected

- `packages/db/supabase/migrations/0002_email_retry.sql` (new)
- `packages/core/src/email-engine/index.ts` — `runDueEmailSends()`
- `packages/core/src/email-engine/index.test.ts` — new test cases

### Approach

1. Apply the migration above.
2. Update `runDueEmailSends()` query to fetch rows where `status IN ('pending', 'retry') AND (next_retry_at IS NULL OR next_retry_at <= now())`.
3. On Resend API failure:
   - Increment `attempts`.
   - If `attempts < 4`: set `status='retry'`, `next_retry_at = now() + interval '5 min' * pow(2, attempts)`.
   - If `attempts >= 4`: set `status='dead_letter'`, `dead_lettered_at = now()`.
   - Capture to Sentry in both cases.
4. On success: `status='sent'`, clear `next_retry_at`.
5. Preserve `status='skipped'` for intentional permanent skips (suppressed address, missing template) — these should **not** retry.

### Acceptance Criteria

- [ ] A Resend 500 error transitions the row to `status='retry'` with a future `next_retry_at`.
- [ ] After 4 failures the row transitions to `status='dead_letter'`.
- [ ] A suppressed-address skip stays `status='skipped'` and is not retried.
- [ ] Unit tests cover the retry progression and dead-letter transition using a mocked Resend client.
- [ ] Migration file is idempotent (`IF NOT EXISTS`).

### Do Not Touch

- The `crm_sync_log` table or its retry logic.
- The `email_suppressions` table.
- Any HubSpot code.

---

## Task 4 — Make Email Cron Idempotent With `status='processing'` Lock

**Priority:** P1 — Reliability  
**Estimated effort:** Small  
**Schema change required:** Yes

### Goal

Prevent duplicate email delivery when the cron is invoked concurrently (e.g., Vercel cron overlap or manual trigger).

### Migration Required

Add to `packages/db/supabase/migrations/0002_email_retry.sql` (or a new `0003_email_processing.sql` if Task 3 is landed separately):

```sql
-- No schema change needed; we use a status transition approach.
-- The fetch-and-mark pattern below uses a single UPDATE...RETURNING.
```

### Files Affected

- `packages/core/src/email-engine/index.ts` — `runDueEmailSends()`
- `apps/web/app/api/cron/email/route.ts`

### Approach

Replace the two-step `SELECT` then `UPDATE` with an atomic `UPDATE ... WHERE status='pending' ... RETURNING *`. Use Supabase's `.update().eq('status', 'pending').lte('scheduled_for', now).select()` which translates to a single `UPDATE ... RETURNING` statement. Rows claimed by one cron invocation move to `status='processing'` immediately; a concurrent invocation will not see them.

Specifically:
1. Change the fetch to: `UPDATE email_sends SET status='processing' WHERE status IN ('pending','retry') AND scheduled_for <= now() AND (next_retry_at IS NULL OR next_retry_at <= now()) RETURNING *` (raw query via `supabase.rpc` or typed `from().update().select()`).
2. If the cron process crashes after claiming rows but before sending, those rows are stuck in `processing`. Add a recovery: rows in `processing` older than 10 minutes are treated as `pending` by the cron (add a `processing_since` column or use `updated_at`).
3. Add `status='processing'` to the allowed status enum if the schema uses a check constraint (current schema uses text, no constraint — this is safe to do without a migration but worth adding a constraint in the same migration).

### Acceptance Criteria

- [ ] Two concurrent cron invocations never deliver the same email twice.
- [ ] A row stuck in `processing` for > 10 minutes is re-attempted on the next cron run.
- [ ] Existing tests continue to pass.

### Do Not Touch

- The Resend API integration.
- Any HubSpot code.
- The admin app.

---

## Task 5 — Fix HubSpot 409 Conflict: Fall Through to `updateContact`

**Priority:** P1 — Reliability  
**Estimated effort:** Small

### Goal

When `createContact` returns HTTP 409 (contact already exists in HubSpot), fall through to `updateContact` rather than treating it as a permanent error that eventually dead-letters.

### Files Affected

- `packages/core/src/crm-sync/index.ts` — `runHubSpotSync()`, `HubSpotAdapter.createContact()`

### Approach

1. In `HubSpotAdapter.createContact()`, if the response status is 409:
   a. Parse the response body to extract the existing contact's `vid` (HubSpot contact ID).
   b. Return a result indicating "already exists" with the `vid`.
2. In `runHubSpotSync()`, if `createContact` returns "already exists":
   a. Call `updateContact(vid, properties)` with the same properties.
   b. Continue to deal creation and list association using the retrieved `vid`.
3. Add a unit test: mocked 409 response triggers `updateContact` with correct `vid`.

### Acceptance Criteria

- [ ] A lead whose email already exists in HubSpot is updated (not dead-lettered).
- [ ] A lead who is new to HubSpot is still created correctly.
- [ ] Unit test covers the 409 → update flow.
- [ ] No changes to the retry/backoff logic.

### Do Not Touch

- The `crm_sync_log` schema.
- Any email engine code.
- The tenant config files.

---

## Task 6 — Alert on CRM `dead_letter` and Email `dead_letter` Transitions

**Priority:** P1 — Observability  
**Estimated effort:** Small

### Goal

When a CRM sync or email send reaches `dead_letter` status, fire a Slack notification and capture a Sentry error. Currently these failures are silent.

### Files Affected

- `packages/core/src/crm-sync/index.ts` — `runDueCrmSync()`
- `packages/core/src/email-engine/index.ts` — `runDueEmailSends()` (after Task 3 adds dead_letter to email)
- `packages/core/src/notifications/index.ts` — add `notifyDeadLetter()`

### Approach

1. Add `notifyDeadLetter(type: 'crm' | 'email', tenantSlug: string, recordId: string, error: string)` to `notifications/index.ts`. It should:
   - Post a Slack message to `SLACK_WEBHOOK_URL` (if configured) with the type, tenant, ID, and error.
   - Call `captureException()` from `@ble/core/error-tracking` with a structured context object.
2. In `runDueCrmSync()`, after writing `status='dead_letter'`, call `notifyDeadLetter('crm', ...)`.
3. In `runDueEmailSends()`, after writing `status='dead_letter'` (Task 3), call `notifyDeadLetter('email', ...)`.
4. Add a unit test for `notifyDeadLetter` with a mocked `fetch` for the Slack call.

### Acceptance Criteria

- [ ] A CRM sync reaching `dead_letter` triggers a Slack message and Sentry event.
- [ ] An email send reaching `dead_letter` triggers a Slack message and Sentry event.
- [ ] If `SLACK_WEBHOOK_URL` is not set, the function logs a warning but does not throw.
- [ ] Unit test verifies the Slack payload structure.

### Do Not Touch

- The `leads` table or lead capture pipeline.
- Admin app data loaders.

---

## Task 7 — Require `UNSUBSCRIBE_SIGNING_SECRET` in Production; Remove Silent Bypass

**Priority:** P1 — Security  
**Estimated effort:** Small

### Goal

The current code treats a missing `UNSUBSCRIBE_SIGNING_SECRET` as "verification always passes," which allows anyone with a lead's email address to craft a valid unsubscribe URL and permanently suppress that address.

### Files Affected

- `packages/core/src/email-engine/index.ts` — `verifyUnsubscribeToken()` and `signUnsubscribeToken()`
- `apps/web/app/unsubscribe/page.tsx`
- `.env.example`

### Approach

1. In `verifyUnsubscribeToken()`: if `UNSUBSCRIBE_SIGNING_SECRET` is not set, **return `false`** (deny) rather than `true` (allow). Log an error explaining the missing secret.
2. In `signUnsubscribeToken()`: if the secret is not set, throw an error rather than generating unsigned tokens. An email sent without a valid unsubscribe link is better than an unsubscribe link that bypasses verification.
3. Add a startup check (in the email engine module or in `apps/web/next.config.ts` `serverRuntimeConfig` validate hook) that throws if `UNSUBSCRIBE_SIGNING_SECRET` is missing when `NODE_ENV === 'production'`.
4. Update `.env.example` to mark this variable as required.

### Acceptance Criteria

- [ ] With `UNSUBSCRIBE_SIGNING_SECRET` unset, `verifyUnsubscribeToken()` returns `false`.
- [ ] With `UNSUBSCRIBE_SIGNING_SECRET` unset, `signUnsubscribeToken()` throws.
- [ ] In production with the secret set, existing HMAC verification works as before.
- [ ] Unit tests cover the missing-secret cases.

### Do Not Touch

- The `email_suppressions` table.
- The Resend API integration.
- Any HubSpot code.

---

## Task 8 — Add Startup Environment Validation

**Priority:** P2 — Reliability / Security  
**Estimated effort:** Small

### Goal

Surface misconfigured deployments at boot time rather than at the moment a code path first fails in production.

### Files Affected

- `apps/web/next.config.ts` — add env validation
- `apps/admin/next.config.ts` — add env validation
- `packages/core/src/index.ts` or a new `packages/core/src/env.ts`

### Approach

1. Install `@t3-oss/env-nextjs` (or write a minimal hand-rolled validator) in `packages/core`.
2. Define required server-side variables:
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
   - `RESEND_API_KEY`
   - `CRON_SECRET`
   - `UNSUBSCRIBE_SIGNING_SECRET` (required in production)
   - `TENANT_SLUG`
3. Define optional variables with defaults.
4. Export the typed env object from `packages/core/src/env.ts` and use it wherever `process.env.X` is currently referenced directly.
5. Import the env module in both `next.config.ts` files so validation runs at build time.

### Acceptance Criteria

- [ ] Building the web app without `SUPABASE_URL` set throws a descriptive error listing the missing variable.
- [ ] All `process.env.X` accesses in `packages/core` go through the typed env object.
- [ ] No `NEXT_PUBLIC_` secrets are accidentally declared as public.
- [ ] Existing tests pass (mock env vars in test setup).

### Do Not Touch

- Any database schema.
- The admin app's Clerk configuration (leave `CLERK_SECRET_KEY` to Clerk's own validation).

---

## Task 9 — Write Tests for Email Send Execution and Resend Webhook Handler

**Priority:** P2 — Test coverage on money paths  
**Estimated effort:** Medium

### Goal

`runDueEmailSends()` and `handleResendWebhook()` are production-critical paths with zero test coverage. Add comprehensive tests using mocked Supabase and Resend clients.

### Files Affected

- `packages/core/src/email-engine/index.test.ts` — extend existing file
- `packages/core/src/email-engine/index.ts` — no logic changes; extract any inline `fetch` calls to injectable dependencies if needed to enable mocking

### Approach

For `runDueEmailSends()`:
1. Mock Supabase client to return a list of pending `email_sends` rows.
2. Mock `fetch` for the Resend API.
3. Test cases:
   - Happy path: row transitions to `sent`, `provider_message_id` set.
   - Suppressed email: Resend is never called, row transitions to `skipped`.
   - Resend 500: row transitions to `retry` with correct `next_retry_at` (requires Task 3 to be landed first, or test against current `skipped` behavior and update after Task 3).
   - Resend 429: same as 500.
   - Unknown tenant slug: row is skipped with a log entry.

For `handleResendWebhook()`:
1. Test `email.opened` event: `opened_at` is set on the correct `email_sends` row.
2. Test `email.clicked` event: `clicked_at` is set.
3. Test `email.bounced` event: `bounced_at` set, `status='bounced'`, `suppressEmail()` called.
4. Test with valid Resend signature (after Task 1) and invalid signature.

### Acceptance Criteria

- [ ] All test cases above pass with `vitest`.
- [ ] No real network calls are made in tests.
- [ ] Tests run in CI (`pnpm test` from monorepo root).

### Do Not Touch

- HubSpot adapter tests.
- Any Next.js app code.
- The database schema.

---

## Task 10 — Fix Demo Tenant `contains ''` Scoring Bug; Enforce Score Bounds

**Priority:** P3 — Lead scoring correctness  
**Estimated effort:** Small

### Goal

The demo tenant awards +10 points to every lead via `company contains ""` regardless of whether a company name was provided. Fix the rule and add a score bounds guard.

### Files Affected

- `packages/tenants/demo/config.ts` — fix scoring rule
- `packages/core/src/lead-scoring/index.ts` — add bounds clamping and an `exists`/`notEmpty` operator
- `packages/core/src/lead-scoring/index.test.ts` — add test cases
- `packages/tenants/_schema/src/index.ts` — add `'exists'` to the operator enum

### Approach

1. Add `'exists'` operator to the `ScoringRuleOperator` enum in `packages/tenants/_schema/src/index.ts`.
2. Implement `'exists'` in `computeLeadScore()`: returns true if the field value is present and non-empty string / non-null.
3. Update the demo tenant rule: change `{ field: 'company', operator: 'contains', value: '' }` to `{ field: 'company', operator: 'exists' }`.
4. After summing all rule points, clamp the final score: `Math.max(0, Math.min(100, rawScore))`. Add a comment noting the intended range.
5. Add test: a demo lead with no `company` field should not receive the +10 company bonus.
6. Add test: a score from rules that sums > 100 is clamped to 100.

### Acceptance Criteria

- [ ] A demo lead with `company: ''` or no company field receives 0 points for the company rule.
- [ ] A demo lead with `company: 'Acme'` receives +10 points for the company rule.
- [ ] A score that would exceed 100 is returned as 100.
- [ ] All existing scoring tests continue to pass.
- [ ] The `'exists'` operator is listed in the Zod schema and rejected values cause a Zod parse error.

### Do Not Touch

- The retirement tenant scoring rules.
- Any database schema.
- Any email or CRM code.
