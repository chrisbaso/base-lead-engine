# Decisions Needed

## Environment Blockers

- **Playwright dependency install blocked**
  - Command blocked: `npx pnpm@10.11.1 add -D @playwright/test`
  - Why it was needed: the Definition of Done requires a Playwright end-to-end happy path through the demo funnel.
  - Workaround used: none yet. The current npm environment is cache-only/offline and `pnpm` is not installed as a direct shell command. Install dependencies when registry access is available, then add the Playwright harness.
- **GitHub push auth blocked from Codex session**
  - Command blocked: `git push origin master`
  - Why it was needed: the autonomy directive asks for periodic GitHub pushes during long-running work.
  - Workaround used: local `HEAD` and `origin/master` currently match commit `632889a`; direct push from this session still fails with `SEC_E_NO_CREDENTIALS`, so authenticated pushes must be run from the user's Git shell if needed.

## Phase 8 Blocker

- **Retirement funnel source missing**
  - Source check: `/reference/retirement-funnel/` contains only `README-for-codex.md`.
  - Why it blocks: Phase 8 requires extracting copy, fields, scoring, tracking, CRM mappings, and email sequences from the actual Replit source.
  - Additional context: partial React page snippets were provided in chat. Extractable items so far:
    - Calendly placeholder: `https://calendly.com/your-link-here`
    - Snapshot email webhook path: `/api/send-snapshot-email`
    - Gate copy: headline `Your Retirement Income Estimate Is Ready`; subheadline `Enter your details below to unlock your personalized monthly income range.`; button `Show My Income Estimate`; consent `By submitting this form, you agree that a licensed professional may follow up regarding your retirement income estimate. No obligation.`
    - Exit-intent copy: headline `Wait — Don't Lose Your Estimate`; body `We'll email your retirement income snapshot so you can review it when you're ready.`; CTA `Email My Estimate`; confirmation `Check your inbox!` / `Your income snapshot is on its way.`; footer `No spam. Just your estimate. Unsubscribe anytime.`
    - Field validation found: `age` 50-80; `state` two-letter state; `retirementSavings` 1-50,000,000; `retirementAge` 55-90; `firstName` required max 50; `email` valid; `phone` optional; exit-intent `email` valid; refine fields for marital status, primary concern, retirement status, and income preference.
    - Tracking helper pushes custom events to `dataLayer`, `fbq("trackCustom")`, and `gtag("event")`; observed event `exit_intent_captured`.
  - Follow-up context: a full pasted calculator component was later provided in chat and used to create `packages/tenants/retirement/` for calculator copy, fields, validation, scoring, and migration checklist preparation.
  - Still missing from source files: API route handlers, email templates, CRM/Zapier integrations, production tracking IDs, and footer component disclosures. These were not fabricated.
  - Workaround used: created a staging-safe tenant package with extracted calculator artifacts only; kept email sequences empty and CRM disabled until source/credentials are available.

## Retirement Migration Review Items

- **Minnesota gating:** Source defaults `state` to `MN` but exposes all US states. No hard Minnesota disqualification was found in the pasted component.
- **Email source missing:** Source references `/api/send-snapshot-email`, but the route/template code was not provided. Retirement sequences are intentionally empty.
- **Tracking IDs missing:** Source shows GTM/dataLayer, Meta Pixel, and gtag helpers but no concrete GTM container, Pixel ID, Google Ads ID, or conversion labels.
- **CRM source missing:** Source uses generated lead create hooks but does not show CRM/Zapier integration details. Retirement CRM is disabled in config until mappings are verified.
- **Calendly placeholder:** Source uses `https://calendly.com/your-link-here`; replace before staging.
- **Retirement UX parity:** Tenant config now preserves calculator fields, copy, validation metadata, scoring, and helper text. The original gated estimate/results/refine/booking UI still requires a custom renderer before cutover.
