import { describe, expect, it } from "vitest";
import {
  calculatorSchema,
  complianceSchema,
  contentSchema,
  tenantConfigSchema
} from "./index";

const validCompliance = {
  firmName: "Smart Retirement MN",
  crdNumber: "9999999",
  advisorName: "Chris Baso",
  advisorTitle: "CFP, CLU, RICP",
  statesLicensed: ["MN", "WI"],
  brokerCheckUrl: "https://brokercheck.finra.org/",
  adv2Url: "https://example.com/adv2",
  privacyPolicyUrl: "https://example.com/privacy",
  disclosureFooter:
    "This is a full disclosure footer that appears on every advisor site page.",
  calculatorDisclosure:
    "This calculator disclosure explains the simplified model used for estimates.",
  requireStateGating: true,
  unlicensedStateMessage: "Not licensed in {state}."
};

const validContent = {
  hero: {
    headline: "Will your savings pay you?",
    subheadline: "See your estimate in 30 seconds.",
    ctaLabel: "Run my numbers"
  },
  about: {
    firmStoryParagraphs: ["Firm story paragraph."],
    advisorBioParagraphs: ["Advisor bio paragraph."],
    photoUrl: "https://example.com/photo.jpg",
    credentials: ["CFP"]
  },
  services: {
    items: [
      {
        title: "Retirement income planning",
        description: "Plan for retirement income across a 30-year horizon.",
        icon: "trending-up"
      }
    ]
  },
  socialProof: {
    clientsServed: "100+",
    yearsInPractice: "15+",
    statesLicensedCount: "4 states"
  },
  schedulingUrl: "https://example.com/schedule"
};

const validCalculator = {
  formulaId: "retirementIncome",
  resultDisplay: {
    headline: "Your estimated monthly retirement paycheck",
    primaryMetricLabel: "Monthly income",
    primaryMetricFormat: "currencyRange",
    lowLabel: "If markets underperform",
    highLabel: "If markets are kind",
    ctaLabel: "Schedule a 15-minute call"
  },
  assumptions:
    "This estimate uses a 4% withdrawal rate and two projected return scenarios."
};

describe("tenantConfigSchema", () => {
  it("rejects invalid tenant slugs", () => {
    const result = tenantConfigSchema.shape.identity.safeParse({
      tenantId: "11111111-1111-4111-8111-111111111111",
      slug: "Bad Slug",
      name: "Bad",
      primaryDomain: "example.test"
    });

    expect(result.success).toBe(false);
  });

  it("validates advisor compliance content", () => {
    const result = complianceSchema.safeParse(validCompliance);

    expect(result.success).toBe(true);
  });

  it("rejects invalid advisor CRD numbers", () => {
    const result = complianceSchema.safeParse({
      ...validCompliance,
      crdNumber: "PLACEHOLDER_CRD"
    });

    expect(result.success).toBe(false);
  });

  it("validates advisor site content", () => {
    const result = contentSchema.safeParse(validContent);

    expect(result.success).toBe(true);
  });

  it("rejects services without items", () => {
    const result = contentSchema.safeParse({
      ...validContent,
      services: { items: [] }
    });

    expect(result.success).toBe(false);
  });

  it("validates calculator config", () => {
    const result = calculatorSchema.safeParse(validCalculator);

    expect(result.success).toBe(true);
  });

  it("keeps advisor extensions optional", () => {
    const result = tenantConfigSchema.safeParse({
      identity: {
        tenantId: "11111111-1111-4111-8111-111111111111",
        slug: "demo",
        name: "Demo",
        primaryDomain: "localhost"
      },
      branding: {
        logoText: "Demo",
        primaryColor: "#14b8a6",
        accentColor: "#f59e0b"
      },
      domains: ["localhost"],
      tracking: { eventMappings: {} },
      leadCapture: {
        type: "quiz",
        headline: "Headline",
        subheadline: "Subheadline",
        steps: [{ id: "one", title: "One", fields: [{ id: "email", label: "Email", type: "email" }] }]
      },
      email: {
        fromAddress: "demo@example.com",
        fromName: "Demo",
        sequences: []
      },
      scoring: {
        rules: [],
        qualifiedThreshold: 1
      },
      crm: {
        provider: "none",
        propertyMappings: {}
      },
      notifications: {
        ownerEmail: "owner@example.com",
        highScoreThreshold: 1
      }
    });

    expect(result.success).toBe(true);
  });
});
