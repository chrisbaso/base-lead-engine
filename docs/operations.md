# Operations

## Stuck Email Sequence

1. Check `email_sends` for rows with `status = 'pending'` and `scheduled_for <= now()`.
2. Confirm the Vercel Cron route `/api/cron/email` is configured and receiving `CRON_SECRET`.
3. Check suppressed recipients in `email_suppressions`.
4. If Resend failed, inspect `email_sends.error`.
5. To rerun a skipped send, set `status = 'pending'`, clear `error`, and set `scheduled_for = now()`.

## Failed CRM Sync

1. Check `crm_sync_log` for `status in ('retry', 'dead_letter')`.
2. Inspect `attempts`, `error`, and `next_retry_at`.
3. Verify the tenant HubSpot token env var named in config exists in Vercel.
4. Confirm pipeline, stage, list, and property IDs in HubSpot.
5. To rerun a dead-lettered sync, set `status = 'retry'`, clear `error`, and set `next_retry_at = now()`.

## Tracking Discrepancies

1. Compare `lead_events.event_id` with Meta and Google diagnostics.
2. Confirm client pixels and server events use the same mapped event names.
3. Verify Meta access token env var and Google Enhanced Conversions endpoint.
4. Watch for double-counting if client and server deduplication is not accepting `event_id`.

## Rate Limit Or Bot False Positives

1. Confirm Upstash env vars are present in the Vercel project.
2. Check whether a shared NAT or proxy is causing many leads to share one IP.
3. Confirm Turnstile site key and secret key are from the same Cloudflare widget.
4. Temporarily remove `TURNSTILE_SECRET_KEY` in staging only to isolate Turnstile failures.

## Admin Access

1. Confirm Clerk keys are present in the admin Vercel project.
2. Confirm the signed-in user's primary email exactly matches `CLERK_ADMIN_EMAIL`.
3. If access fails during local builds, use `.env.local`; `.env.example` is documentation only.

## Logs And Errors

- Application logs are structured JSON from `packages/core/src/logger`.
- Every production path should include `tenant_id` where a tenant is known.
- Sentry capture activates when `SENTRY_DSN` is configured.
- For a failed lead submission, correlate log entries by tenant, user agent, IP, and Supabase timestamps.
