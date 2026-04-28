# Decisions Needed

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
- **Retirement UX parity:** Tenant config now preserves calculator fields, copy, validation metadata, scoring, and helper text. The original gated estimate/results/refine/booking UI still requires a custom renderer before cutover.
