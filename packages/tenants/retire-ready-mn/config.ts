import { defineTenantConfig } from "@ble/tenant-schema";
import { retireReadyMnCopy } from "./copy";
import { retireReadyMnLeadCapture } from "./leadCapture";
import { retireReadyMnScoring } from "./scoring";
import { retireReadyMnSequences } from "./sequences";

export default defineTenantConfig({
  identity: {
    tenantId: "55555555-5555-4555-8555-555555555555",
    slug: "retire-ready-mn",
    name: "RetireReadyMN",
    primaryDomain: "retirereadymn.com"
  },
  branding: {
    logoText: "RetireReadyMN",
    primaryColor: "#0F2547",
    accentColor: "#C9A961"
  },
  domains: ["retirereadymn.com", "www.retirereadymn.com", "retire-ready-mn.localhost"],
  tracking: {
    metaPixelId: "RETIRE_READY_MN_META_PIXEL_ID",
    eventMappings: {
      PageView: { gtm: "page_view", meta: "PageView", googleAds: "page_view" },
      LeadStarted: { gtm: "checkup_started", meta: "Lead", googleAds: "lead_started" },
      LeadStepCompleted: {
        gtm: "checkup_step_completed",
        meta: "CustomizeProduct",
        googleAds: "checkup_step_completed"
      },
      LeadCompleted: { gtm: "checkup_completed", meta: "Lead", googleAds: "conversion" },
      LeadQualified: { gtm: "checkup_qualified", meta: "CompleteRegistration", googleAds: "qualified_lead" }
    }
  },
  leadCapture: retireReadyMnLeadCapture,
  email: {
    fromAddress: "hello@retirereadymn.com",
    fromName: "RetireReadyMN",
    sequences: retireReadyMnSequences
  },
  scoring: retireReadyMnScoring,
  crm: {
    provider: "none",
    propertyMappings: {
      firstName: "first_name",
      lastName: "last_name",
      email: "email",
      phone: "phone",
      age: "age",
      currentSavings: "current_savings",
      targetRetirementAge: "target_retirement_age",
      retirementScore: "retirement_score",
      scoreBand: "score_band",
      primaryConcern: "primary_concern"
    }
  },
  notifications: {
    ownerEmail: "ops@retirereadymn.com",
    fromAddress: "hello@retirereadymn.com",
    highScoreThreshold: 76
  },
  calculator: {
    formulaId: "retirementIncome",
    resultDisplay: {
      headline: retireReadyMnCopy.identity.headline,
      primaryMetricLabel: "Retirement income score",
      primaryMetricFormat: "number",
      lowLabel: "Income gap",
      highLabel: "On track",
      ctaLabel: "Get matched with a Minnesota specialist"
    },
    assumptions: retireReadyMnCopy.calculatorDisclosure
  }
});
