import { defineTenantConfig } from "@ble/tenant-schema";
import { demoSequences } from "./sequences";

export default defineTenantConfig({
  identity: {
    tenantId: "11111111-1111-4111-8111-111111111111",
    slug: "demo",
    name: "Demo Lead Engine",
    primaryDomain: "demo.localhost"
  },
  branding: {
    logoText: "Demo Lead Engine",
    primaryColor: "#14b8a6",
    accentColor: "#f59e0b"
  },
  domains: ["localhost", "demo.localhost"],
  tracking: {
    gtmContainerId: "GTM-DEMO",
    metaPixelId: "1234567890",
    metaAccessTokenEnv: "DEMO_META_ACCESS_TOKEN",
    googleAdsConversionId: "AW-DEMO",
    googleAdsConversionLabel: "demo_lead",
    googleAdsEnhancedConversionsEndpoint: "https://example.com/google-enhanced-conversions",
    eventMappings: {
      PageView: { gtm: "page_view", meta: "PageView", googleAds: "page_view" },
      LeadStarted: { gtm: "lead_started", meta: "Lead", googleAds: "lead_started" },
      LeadStepCompleted: {
        gtm: "lead_step_completed",
        meta: "CustomizeProduct",
        googleAds: "lead_step_completed"
      },
      LeadCompleted: { gtm: "lead_completed", meta: "Lead", googleAds: "conversion" },
      LeadQualified: { gtm: "lead_qualified", meta: "CompleteRegistration", googleAds: "qualified_lead" }
    }
  },
  leadCapture: {
    type: "quiz",
    headline: "Launch a lead funnel without new code",
    subheadline: "Answer three quick questions and see the lead engine capture flow in action.",
    steps: [
      {
        id: "goal",
        title: "What are you trying to launch?",
        fields: [
          {
            id: "launch_goal",
            label: "Launch goal",
            type: "select",
            required: true,
            options: ["Quiz funnel", "Calculator funnel", "Lead form"]
          }
        ]
      },
      {
        id: "volume",
        title: "How many leads do you want each month?",
        fields: [
          { id: "monthly_leads", label: "Target leads per month", type: "number", required: true }
        ]
      },
      {
        id: "contact",
        title: "Where should we send the demo plan?",
        fields: [
          { id: "email", label: "Email", type: "email", required: true, capturePartial: true },
          { id: "company", label: "Company", type: "text", required: true }
        ]
      }
    ]
  },
  email: {
    fromAddress: "demo@example.com",
    fromName: "Demo Lead Engine",
    sequences: demoSequences
  },
  scoring: {
    rules: [
      {
        field: "monthly_leads",
        operator: "greaterThan",
        value: 99,
        points: 40,
        reason: "High monthly lead target"
      },
      {
        field: "launch_goal",
        operator: "equals",
        value: "Calculator funnel",
        points: 20,
        reason: "Calculator funnels usually indicate high commercial intent"
      },
      {
        field: "company",
        operator: "contains",
        value: "",
        points: 10,
        reason: "Company provided"
      }
    ],
    qualifiedThreshold: 70
  },
  crm: {
    provider: "hubspot",
    apiKeyEnv: "DEMO_HUBSPOT_PRIVATE_APP_TOKEN",
    pipelineId: "demo-pipeline",
    defaultStage: "appointmentscheduled",
    listId: "demo-list",
    propertyMappings: {
      email: "email",
      company: "company",
      launch_goal: "launch_goal",
      monthly_leads: "monthly_leads"
    }
  },
  notifications: {
    ownerEmail: "owner@example.com",
    fromAddress: "alerts@example.com",
    highScoreThreshold: 70
  }
});
