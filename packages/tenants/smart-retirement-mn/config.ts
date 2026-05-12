import { defineTenantConfig } from "@ble/tenant-schema";
import { smartRetirementCopy } from "./copy";
import { smartRetirementLeadCapture } from "./leadCapture";
import { smartRetirementScoring } from "./scoring";
import { smartRetirementSequences } from "./sequences";

export default defineTenantConfig({
  identity: {
    tenantId: "33333333-3333-4333-8333-333333333333",
    slug: "smart-retirement-mn",
    name: "Smart Retirement MN",
    primaryDomain: "smartretirementmn.com"
  },
  branding: {
    logoText: "Smart Retirement MN",
    primaryColor: "#1a3a6e",
    accentColor: "#c9a961"
  },
  domains: ["smartretirementmn.com", "smart-retirement-mn.localhost"],
  tracking: {
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
  compliance: {
    firmName: "Smart Retirement MN",
    crdNumber: "9999999",
    advisorName: "Chris Baso",
    advisorTitle: "CFP®, CLU®, RICP®",
    statesLicensed: ["MN", "WI", "ND", "SD"],
    brokerCheckUrl: "https://brokercheck.finra.org/",
    adv2Url: "https://example.com/adv2-placeholder",
    privacyPolicyUrl: "https://example.com/privacy-placeholder",
    disclosureFooter: smartRetirementCopy.disclosureFooter,
    calculatorDisclosure: smartRetirementCopy.calculatorDisclosure,
    requireStateGating: true,
    unlicensedStateMessage: smartRetirementCopy.unlicensedStateMessage
  },
  content: {
    hero: smartRetirementCopy.hero,
    about: {
      firmStoryParagraphs: [...smartRetirementCopy.about.firmStoryParagraphs],
      advisorBioParagraphs: [...smartRetirementCopy.about.advisorBioParagraphs],
      photoUrl: "https://example.com/chris-baso-placeholder.jpg",
      credentials: [...smartRetirementCopy.about.credentials]
    },
    services: {
      items: smartRetirementCopy.services.map((service) => ({ ...service }))
    },
    socialProof: {
      clientsServed: "Families across the Upper Midwest",
      yearsInPractice: "15+ years",
      statesLicensedCount: "4 states"
    },
    insights: [
      {
        category: "Retirement Income",
        headline: "Turning a balance into a paycheck",
        excerpt: "A retirement account statement tells you what you have. An income plan tells you what you can spend.",
        date: "Template insight"
      },
      {
        category: "Roth Strategy",
        headline: "The tax window most retirees miss",
        excerpt: "The years between retirement and required distributions can be a planning opportunity when modeled carefully.",
        date: "Template insight"
      },
      {
        category: "Annuity Math",
        headline: "When guarantees earn their place",
        excerpt: "Income guarantees should be compared against alternatives, costs, liquidity, and the role they play in the plan.",
        date: "Template insight"
      }
    ],
    schedulingUrl: "https://calendly.com/chrisbaso/15min-placeholder"
  },
  calculator: {
    formulaId: "retirementIncome",
    resultDisplay: {
      headline: smartRetirementCopy.calculator.headline,
      primaryMetricLabel: "Monthly income",
      primaryMetricFormat: "currencyRange",
      lowLabel: smartRetirementCopy.calculator.lowLabel,
      highLabel: smartRetirementCopy.calculator.highLabel,
      ctaLabel: smartRetirementCopy.calculator.ctaLabel
    },
    assumptions: smartRetirementCopy.calculator.assumptions
  },
  leadCapture: smartRetirementLeadCapture,
  email: {
    fromAddress: "alerts@smartretirementmn.com",
    fromName: "Smart Retirement MN",
    sequences: smartRetirementSequences
  },
  scoring: smartRetirementScoring,
  crm: {
    provider: "none",
    propertyMappings: {
      firstName: "firstname",
      email: "email",
      phone: "phone",
      currentAge: "current_age",
      retirementAge: "retirement_age",
      retirementSavings: "retirement_savings",
      state: "state",
      maritalStatus: "marital_status",
      retirementStatus: "retirement_status",
      primaryConcern: "primary_concern",
      incomePreference: "income_preference"
    }
  },
  notifications: {
    ownerEmail: "owner@smartretirementmn.com",
    fromAddress: "alerts@smartretirementmn.com",
    highScoreThreshold: 85
  }
});
