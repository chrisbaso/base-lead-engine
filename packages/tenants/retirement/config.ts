import { defineTenantConfig } from "@ble/tenant-schema";
import { retirementLeadCapture } from "./leadCapture";
import { retirementScoring } from "./scoring";
import { retirementSequences } from "./sequences";

export default defineTenantConfig({
  identity: {
    tenantId: "22222222-2222-4222-8222-222222222222",
    slug: "retirement",
    name: "Retirement Income Review",
    primaryDomain: "retirement.localhost"
  },
  branding: {
    logoText: "Retirement Income Review",
    primaryColor: "#1a3a6e",
    accentColor: "#14b8a6"
  },
  domains: ["retirement.localhost"],
  tracking: {
    eventMappings: {
      PageView: { gtm: "page_view", meta: "PageView", googleAds: "page_view" },
      LeadStarted: { gtm: "step1_complete", meta: "Lead", googleAds: "lead_started" },
      LeadStepCompleted: { gtm: "gate_complete", meta: "CustomizeProduct", googleAds: "gate_complete" },
      LeadCompleted: { gtm: "lead_created", meta: "Lead", googleAds: "conversion" },
      LeadQualified: { gtm: "refine_complete", meta: "CompleteRegistration", googleAds: "qualified_lead" }
    }
  },
  leadCapture: retirementLeadCapture,
  email: {
    fromAddress: "retirement-staging@example.com",
    fromName: "Retirement Income Review",
    sequences: retirementSequences
  },
  scoring: retirementScoring,
  crm: {
    provider: "none",
    propertyMappings: {
      firstName: "firstname",
      email: "email",
      phone: "phone",
      age: "age",
      state: "state",
      retirementSavings: "retirement_savings",
      retirementAge: "retirement_age",
      maritalStatus: "marital_status",
      primaryConcern: "primary_concern",
      retirementStatus: "retirement_status",
      incomePreference: "income_preference"
    }
  },
  notifications: {
    ownerEmail: "owner@example.com",
    fromAddress: "retirement-staging@example.com",
    highScoreThreshold: 8
  }
});
