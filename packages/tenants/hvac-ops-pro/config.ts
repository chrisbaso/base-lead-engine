import { defineTenantConfig } from "@ble/tenant-schema";
import { hvacOpsProLeadCapture } from "./leadCapture";
import { hvacOpsProScoring } from "./scoring";
import { hvacOpsProSequences } from "./sequences";

export default defineTenantConfig({
  identity: {
    tenantId: "44444444-4444-4444-8444-444444444444",
    slug: "hvac-ops-pro",
    name: "HVAC Ops Pro",
    primaryDomain: "hvacopspro.com"
  },
  branding: {
    logoText: "HVAC Ops Pro",
    primaryColor: "#1f2937",
    accentColor: "#f97316"
  },
  domains: ["hvacopspro.com", "hvac-ops-pro.localhost"],
  tracking: {
    metaPixelId: process.env.NEXT_PUBLIC_HVAC_OPS_PRO_META_PIXEL_ID,
    metaAccessTokenEnv: "HVAC_OPS_PRO_META_ACCESS_TOKEN",
    eventMappings: {
      PageView: { meta: "PageView", gtm: "page_view", googleAds: "page_view" },
      LeadStarted: { meta: "Lead", gtm: "lead_started", googleAds: "lead_started" },
      LeadStepCompleted: { meta: "CustomizeProduct", gtm: "lead_step_completed", googleAds: "lead_step_completed" },
      LeadCompleted: { meta: "Lead", gtm: "lead_completed", googleAds: "conversion" },
      LeadQualified: { meta: "CompleteRegistration", gtm: "lead_qualified", googleAds: "qualified_lead" },
      ViewContent: { meta: "ViewContent", gtm: "affiliate_click", googleAds: "view_content" }
    }
  },
  leadCapture: hvacOpsProLeadCapture,
  email: {
    fromAddress: "recommendations@hvacopspro.com",
    fromName: "HVAC Ops Pro",
    sequences: hvacOpsProSequences
  },
  scoring: hvacOpsProScoring,
  crm: {
    provider: "none",
    propertyMappings: {
      firstName: "firstname",
      email: "email",
      teamSize: "team_size",
      biggestHeadache: "biggest_headache",
      usingSoftware: "using_software",
      currentSoftware: "current_software",
      monthlyRevenueRange: "monthly_revenue_range",
      recommendedSoftware: "recommended_software"
    }
  },
  notifications: {
    ownerEmail: "owner@hvacopspro.com",
    fromAddress: "recommendations@hvacopspro.com",
    highScoreThreshold: 75
  }
});
