# Retirement Funnel Migration Checklist

Do not deploy or switch traffic until every item is checked.

## Source Verification

- [ ] Copy the full Replit retirement funnel project into `reference/retirement-funnel/`.
- [ ] Verify the pasted calculator component matches the source file byte-for-byte.
- [ ] Locate and review `/api/send-snapshot-email`.
- [ ] Locate any Resend templates, scheduling logic, webhook handlers, or Zapier steps.
- [ ] Locate GTM, Meta Pixel, Google Ads, GA4, and any third-party scripts.
- [ ] Locate Footer disclosure text and copy it exactly into `packages/tenants/retirement/copy.ts`.

## Tenant Config Review

- [ ] Review `packages/tenants/retirement/config.ts`.
- [ ] Replace `retirement.localhost` with the staging domain only after preview validation.
- [ ] Replace `retirement-staging@example.com` with the approved staging Resend sender.
- [ ] Confirm `owner@example.com` is replaced with the correct notification inbox.
- [ ] Confirm CRM remains disabled until a staging HubSpot/private app mapping is ready.

## Copy And Compliance

- [ ] Legal/compliance review of all disclosures in `packages/tenants/retirement/copy.ts`.
- [ ] Confirm the exact footer disclosures from the Replit source are present.
- [ ] Confirm educational-only language appears on calculator, results, booking, and email surfaces.
- [ ] Confirm no carrier/product-specific language is introduced by the migration.

## Lead Capture

- [ ] Confirm fields and validation match source:
  - [ ] age: 50-80
  - [ ] state: two-letter state
  - [ ] retirementSavings: 1-50,000,000
  - [ ] retirementAge: 55-90
  - [ ] firstName: required, max 50
  - [ ] email: valid email
  - [ ] phone: optional
  - [ ] maritalStatus, retirementStatus, primaryConcern, incomePreference refine fields
- [ ] Confirm exit-intent triggers only on the gate step and once per session.
- [ ] Confirm exit-intent creates a low-tier partial lead and sends a snapshot email.

## Scoring

- [ ] Review `packages/tenants/retirement/scoring.ts` against the source `calculateScore` function.
- [ ] Confirm high tier equals score >= 8.
- [ ] Confirm medium tier equals score >= 4.
- [ ] Decide whether Minnesota-only gating should disqualify non-MN leads; the pasted source defaults to MN but allows all US states.

## Tracking

- [ ] Add production GTM container ID.
- [ ] Add Meta Pixel ID and server-side CAPI access token env var.
- [ ] Add Google Ads conversion ID, label, and Enhanced Conversions endpoint.
- [ ] Verify event mapping parity:
  - [ ] `step1_complete`
  - [ ] `gate_complete`
  - [ ] `lead_created`
  - [ ] `refine_complete`
  - [ ] `cta_clicked`
  - [ ] `booking_clicked`
  - [ ] `exit_intent_captured`
  - [ ] `exit_intent_submit`
- [ ] Confirm Meta and Google deduplicate server/client events by `event_id` before paid traffic cutover.

## Email

- [ ] Extract the actual snapshot email from `/api/send-snapshot-email`.
- [ ] Extract all Resend drip templates and schedules.
- [ ] Convert templates to `packages/tenants/retirement/emails/` without paraphrasing compliance copy.
- [ ] Preserve unsubscribe footer exactly.
- [ ] Test with staging Resend domain only.

## CRM

- [ ] Identify whether the Replit funnel uses direct CRM calls or Zapier.
- [ ] If Zapier exists, list each zap step in `docs/decisions-needed.md`.
- [ ] Map lead fields to staging HubSpot properties.
- [ ] Set staging HubSpot private app token env var.
- [ ] Run a staging contact/deal/list sync test without touching production HubSpot.

## HeyGen And Booking

- [ ] Confirm HeyGen embed URL and playback controls:
  - `https://app.heygen.com/embeds/5f5089a61f834cef8bd29e0099696812?autoplay=1&muted=1`
- [ ] Replace placeholder Calendly URL `https://calendly.com/your-link-here`.
- [ ] Verify high-tier video placement after CTA.
- [ ] Verify medium/low/unrefined video placement before CTA.

## Cutover

- [ ] Deploy preview tenant with `TENANT_SLUG=retirement`.
- [ ] Submit test lead and confirm Supabase lead, events, score, email queue, CRM queue, and tracking diagnostics.
- [ ] Confirm unsubscribe works.
- [ ] Confirm rate limiting and Turnstile pass/fail behavior.
- [ ] Confirm no production Resend domain or production HubSpot account is used during staging.
- [ ] Lower DNS TTL before cutover.
- [ ] Pause paid traffic.
- [ ] Point domain only after final smoke test.
- [ ] Resume paid traffic gradually.

## Rollback

- [ ] Keep the Replit funnel live until post-cutover tracking and lead capture are verified.
- [ ] If conversion tracking, form submit, email, or CRM fails, pause paid traffic immediately.
- [ ] Repoint DNS to Replit using the previous records.
- [ ] Restore prior traffic routing and verify lead capture on Replit.
