# Retirement Funnel — Migration Reference for Codex

**Audience:** You (Codex), in Phase 8 of the platform build.
**Purpose:** Extract the retirement funnel's offer, copy, fields, scoring, and
sequences out of the existing Replit implementation in this `/reference/`
folder and reconstruct it as a tenant config at
`/packages/tenants/retirement/` in the new platform.

**Critical constraint:** Do NOT deploy this tenant. Do NOT point any domain at
it. Do NOT modify any code in `/reference/`. The live funnel is currently
running on Replit and serving paid Facebook traffic. Your job is to prepare a
faithful migration that I can review and cut over manually when I'm back.

---

## The funnel in one paragraph

This is a Minnesota-targeted consumer retirement income estimator, branded
"Retirement Income Review." It is intentionally NOT branded as a carrier or
annuity product — it's a top-of-funnel demand-creation play that captures
leads via a lightweight financial estimator, then nurtures them via email
toward an annuity conversation. Traffic is Facebook (primary, demand
creation) with Google Ads as retargeting only. GTM and Meta Pixel fire
throughout. An exit-intent modal captures abandoners. A drip email sequence
is delivered via Resend.

## What to extract

For each section below: read the relevant files in `/reference/`, extract the
listed artifact, and place it in the corresponding location in the new
platform. If a field is ambiguous, pick the most conservative interpretation
and log the decision to `/docs/decisions-needed.md`.

### 1. Offer + copy
**Source:** landing page components, results page, email templates, ad copy
if present.
**Destination:** `/packages/tenants/retirement/copy.ts`

Extract:
- Hero headline + subhead
- Primary CTA text (likely "Get My Retirement Income Estimate" or similar)
- Trust signals (testimonials, credentials, disclosures)
- Results page narrative (what the estimator tells the user after they
  complete it)
- Exit-intent modal copy
- All form labels, helper text, validation error messages
- Footer disclaimers — copy these EXACTLY. Insurance/financial copy has
  compliance implications. Do not paraphrase.

Structure copy as a typed object keyed by section. Do not inline copy in
components.

### 2. Lead-capture definition
**Source:** the multi-step form/quiz components.
**Destination:** `/packages/tenants/retirement/leadCapture.ts` — must satisfy
the `LeadCaptureSchema` Zod type from `/packages/tenants/_schema`.

Extract for each step:
- Step name (machine slug + display title)
- Fields: name, type, validation rules, required/optional, helper text
- Branching logic (if any field's value changes which step comes next)
- Progress indicator behavior (linear vs. percent-based)
- Partial-save trigger point — at which step does email get captured so a
  drop-off still becomes a lead?

Common fields in this funnel (verify against source, do not assume):
- Age, retirement target age, current savings, income, marital status, ZIP
  code (Minnesota gating likely lives here), email, phone, name.

If you find a field in the source that doesn't fit the platform's standard
field types, extend the schema rather than dropping the field. Log the
extension in `/docs/decisions-needed.md`.

### 3. Lead scoring rules
**Source:** wherever lead scoring or qualification logic lives — could be in
the form submission handler, a webhook, or a Zapier step. Search for terms
like "score", "qualified", "tier", "priority".
**Destination:** `/packages/tenants/retirement/scoring.ts`

The qualification model for this funnel is roughly:
- Age 55–72 = high value (target window for FIA conversion)
- Investable assets above a threshold = high value
- ZIP outside Minnesota = disqualified or low priority (verify exact
  geo-gating)
- Missing email or phone = unqualified regardless of other signals

Express each rule as `{ field, operator, value, points, reason }`. Do not
hardcode thresholds — surface them at the top of the file as named constants
so I can tune them without touching rule logic.

If the source has no explicit scoring (i.e., all leads were treated equally),
note that in `/docs/decisions-needed.md` and propose a scoring model based on
the qualification logic above. Do NOT silently invent scoring that didn't
exist.

### 4. Email sequences
**Source:** Resend integration code, email templates, scheduling logic.
**Destination:** `/packages/tenants/retirement/sequences.ts` and email
template components in `/packages/tenants/retirement/emails/`.

Extract per email:
- Subject line (exact)
- From name + from address
- Delay from previous step (in hours — convert from whatever unit the source
  uses)
- Send conditions (does this email only send to qualified leads? to leads
  who didn't book a call?)
- Body content — convert to React Email components, preserving copy verbatim
- Any merge tags (first name, estimated income, etc.) — map to the platform's
  merge tag system
- Unsubscribe footer — preserve exactly, this is CAN-SPAM territory

If the source uses HTML templates rather than React Email, convert them but
keep a side-by-side comparison note in `/docs/migration-checklist.md` so I
can verify rendering parity before cutover.

### 5. Tracking configuration
**Source:** GTM container references, Meta Pixel ID, Google Ads conversion
IDs in the source code or in the page `<head>`.
**Destination:** `/packages/tenants/retirement/config.ts` (the tracking
section)

Extract:
- GTM container ID
- Meta Pixel ID
- Google Ads conversion ID + label(s) per conversion event
- Custom event names and where they fire (page view, step complete, lead
  submit, exit intent dismiss, exit intent capture)

**Important:** the new platform uses server-side Meta CAPI and Google
Enhanced Conversions in addition to client pixels. The source funnel
probably only uses client pixels. Set up the server-side equivalents using
the same Pixel ID / Conversion ID — Meta and Google deduplicate via
event_id. Document in the migration checklist that I'll need to verify
deduplication is working before cutover or we'll double-count conversions
and ad spend will get wonky.

### 6. CRM mapping
**Source:** wherever leads are pushed to a CRM (HubSpot likely, possibly via
Zapier in the current setup).
**Destination:** `/packages/tenants/retirement/config.ts` (the crm section)

Extract:
- Pipeline ID
- Default lifecycle stage / deal stage on creation
- Custom property mappings (form field → HubSpot property)
- Any list IDs the lead gets added to
- Any owner assignment rules

If the current setup uses Zapier rather than direct HubSpot API: do NOT
preserve the Zapier dependency. The new platform calls HubSpot directly. Map
the Zapier steps to direct API calls and document the change in the
migration checklist.

### 7. Video placement

Video has been removed from scope. Do not migrate third-party video embeds or add a
replacement video block unless a future prompt explicitly asks for one.

### 8. Exit-intent modal
**Source:** likely a separate component listening for mouseleave at the top
of the viewport.
**Destination:** the platform's built-in exit-intent hook in `/packages/core/
lead-capture`. Configure via tenant config.

Extract:
- Trigger conditions (cursor leaves top? after how many seconds on page?
  only fire once per session?)
- Modal headline + body copy
- The capture mechanism (email-only? full form?)
- What happens after capture (different thank-you message? same email
  sequence? different sequence?)

---

## Things to flag in `/docs/decisions-needed.md`

When you encounter any of these, do NOT guess silently — log them:

1. Any compliance/disclosure language that seems unusual or
   carrier-specific.
2. Any field validation rule that looks state-specific (Minnesota residency
   checks, age minimums tied to insurance regs).
3. Any tracking event that fires conditionally based on lead score or field
   values — these are easy to break in migration.
4. Any email that references specific products, carriers, or pricing —
   these need legal review before cutover.
5. Any third-party script in the source that isn't GTM/Meta/Google.
   List it. Don't port it without confirmation.
6. Any Zapier multi-step zap — list every step in order. The platform's CRM
   sync replaces some, but if a zap is doing something else (Slack
   notification, Google Sheets log, SMS), that needs a deliberate decision.

## Things you should NOT do

- Do not register a domain.
- Do not point DNS.
- Do not create a Vercel project for this tenant.
- Do not push contacts to the live HubSpot account — use the test account
  set up for the demo tenant, or create a `retirement-staging` HubSpot
  account if needed and document it.
- Do not send any email through the production Resend domain. Use a
  staging from-address.
- Do not modify `/reference/retirement-funnel/`. Read-only.

## Definition of done for Phase 8

- `/packages/tenants/retirement/` complete and passes the tenant config
  schema validation
- All copy, fields, scoring, sequences, tracking, CRM mappings extracted
- React Email templates render correctly in dev
- A test run against staging Resend + staging HubSpot completes the full
  lead lifecycle without errors
- `/docs/migration-checklist.md` written: a numbered, checkbox-style list of
  every step I need to take to cut traffic over from Replit to the new
  platform safely. Include rollback instructions.
- `/docs/decisions-needed.md` updated with everything you flagged

When all of the above is true, commit and stop. Do not deploy. Do not switch
traffic. Wait for me.
