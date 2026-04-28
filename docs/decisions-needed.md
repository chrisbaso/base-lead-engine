# Decisions Needed

## Phase 1 Defaults

- **Admin Supabase access model:** Defaulted to service-role reads in future admin data loaders, gated by Clerk allowlist. This preserves tenant RLS for public funnel paths while letting the owner dashboard span tenants.
- **Tenant claim strategy:** Defaulted to `request.jwt.claims.tenant_id` for RLS. If Clerk JWT templates are used, add the active tenant ID claim there.
- **Next.js version:** Requirement says Next.js 15. Pinned `next@15.5.7`, the patched 15.x line documented as safe for App Router deployments.

## Environment Blockers

- **Git push remote missing**
  - Command blocked: `git push`
  - Why it was needed: the autonomy directive asks for periodic GitHub pushes during long-running work.
  - Workaround used: commits are being created locally; push is skipped until a remote is configured with `git remote add`.
- **Git commit permission blocked after Phase 3**
  - Command blocked: `git commit -m "feat: add resend email sequence engine"`
  - Why it was needed: checkpoint Phase 3 after typecheck, lint, test, and build passed.
  - Workaround used: changes remain staged locally; continued implementation because source files are still editable.
- **Git staging permission blocked after Phase 5**
  - Command blocked: `git add .`
  - Why it was needed: stage verified Phase 3-5 work for a checkpoint commit and push.
  - Workaround used: documented the blocker and continued implementation; source files remain editable, but Git cannot update `.git/index.lock` from this agent session.
- **Git ACL repair blocked**
  - Command blocked: `takeown /F .git /R /D Y`
  - Why it was needed: `.git` has an explicit DENY ACL for orphan SID `S-1-5-21-2268178018-374602974-933321352-2642198855`, which prevents Git from creating `.git/index.lock`.
  - Workaround used: none from this non-elevated session. Run the ACL repair from an Administrator terminal, then retry `git add`, `git commit`, and `git push`.

## Phase 2 Defaults

- **Google Enhanced Conversions transport:** Defaulted to a tenant-configurable HTTPS endpoint because no Google Ads API OAuth/client credential strategy exists in the workspace. The interface is isolated in `packages/core/src/tracking/index.ts` so it can be swapped for direct Google Ads API calls once credentials and account shape are known.
- **Pre-email partial leads:** Defaulted to localStorage only until an email is captured. This avoids creating anonymous database rows that cannot be nurtured or deduplicated.

## Phase 3 Defaults

- **Resend SDK dependency:** Used direct Resend REST API calls instead of adding the SDK because the interface is small and this avoids another runtime client at module scope. The wrapper lives in `packages/core/src/email-engine/index.ts`.
- **Unsubscribe token:** Defaulted to tenant ID plus email query parameters for the MVP unsubscribe link. Phase 6 should replace this with a signed token once the shared app secret strategy is finalized.

## Phase 4 Defaults

- **HubSpot association IDs:** Defaulted to HubSpot-defined association type ID `3` for deal-to-contact and `202` for note-to-contact. Verify these against the staging portal before production sync.
- **Demo CRM identifiers:** Used placeholder demo pipeline, stage, list, and private app token env names so the adapter can build and test without live credentials.

## Phase 5 Defaults

- **Admin build fallback key:** Added a non-secret Clerk publishable-key fallback for local/build environments where `.env` is absent. Production deployments must set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `CLERK_ADMIN_EMAIL`.
- **Admin data source:** Used static/demo admin MVP views until staging Supabase credentials are available. The lead tables already persist scores, events, email sends, and CRM logs for the real data loaders.
- **High-score notifications:** Defaulted to Slack webhook plus Resend email only when tenant notification credentials are configured. Missing credentials skip delivery instead of failing lead capture.

## Phase 6 Defaults

- **Rate limiting provider:** Defaulted to Upstash Redis REST for production and in-memory counters for local development when Upstash env vars are absent.
- **Bot protection:** Defaulted to Cloudflare Turnstile and only enforces verification when `TURNSTILE_SECRET_KEY` is configured. Partial saves remain rate-limited but do not require Turnstile tokens.
- **Sentry integration:** Used direct Sentry envelope ingestion via `SENTRY_DSN` instead of adding `@sentry/nextjs` while credentials are absent. Consider the SDK before launch if source map upload and release tracking are required.

## Phase 8 Blocker

- **Retirement funnel source missing**
  - Source check: `/reference/retirement-funnel/` contains only `README-for-codex.md`.
  - Why it blocks: Phase 8 requires extracting copy, fields, scoring, tracking, CRM mappings, HeyGen placement, and email sequences from the actual Replit source.
  - Additional context: partial React page snippets were provided in chat. Extractable items so far:
    - HeyGen/VSL embed URL: `https://app.heygen.com/embeds/5f5089a61f834cef8bd29e0099696812?autoplay=1&muted=1`
    - Calendly placeholder: `https://calendly.com/your-link-here`
    - Snapshot email webhook path: `/api/send-snapshot-email`
    - Gate copy: headline `Your Retirement Income Estimate Is Ready`; subheadline `Enter your details below to unlock your personalized monthly income range.`; button `Show My Income Estimate`; consent `By submitting this form, you agree that a licensed professional may follow up regarding your retirement income estimate. No obligation.`
    - Exit-intent copy: headline `Wait — Don't Lose Your Estimate`; body `We'll email your retirement income snapshot so you can review it when you're ready.`; CTA `Email My Estimate`; confirmation `Check your inbox!` / `Your income snapshot is on its way.`; footer `No spam. Just your estimate. Unsubscribe anytime.`
    - Field validation found: `age` 50-80; `state` two-letter state; `retirementSavings` 1-50,000,000; `retirementAge` 55-90; `firstName` required max 50; `email` valid; `phone` optional; exit-intent `email` valid; refine fields for marital status, primary concern, retirement status, and income preference.
    - Tracking helper pushes custom events to `dataLayer`, `fbq("trackCustom")`, and `gtag("event")`; observed event `exit_intent_captured`.
  - Follow-up context: a full pasted calculator component was later provided in chat and used to create `packages/tenants/retirement/` for calculator copy, fields, validation, scoring, HeyGen placement, and migration checklist preparation.
  - Still missing from source files: API route handlers, email templates, CRM/Zapier integrations, production tracking IDs, and footer component disclosures. These were not fabricated.
  - Workaround used: created a staging-safe tenant package with extracted calculator artifacts only; kept email sequences empty and CRM disabled until source/credentials are available.

## Retirement Migration Review Items

- **Minnesota gating:** Source defaults `state` to `MN` but exposes all US states. No hard Minnesota disqualification was found in the pasted component.
- **Email source missing:** Source references `/api/send-snapshot-email`, but the route/template code was not provided. Retirement sequences are intentionally empty.
- **Tracking IDs missing:** Source shows GTM/dataLayer, Meta Pixel, and gtag helpers but no concrete GTM container, Pixel ID, Google Ads ID, or conversion labels.
- **CRM source missing:** Source uses generated lead create hooks but does not show CRM/Zapier integration details. Retirement CRM is disabled in config until mappings are verified.
- **Calendly placeholder:** Source uses `https://calendly.com/your-link-here`; replace before staging.
