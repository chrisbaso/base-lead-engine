import { z } from "zod";

export const fieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "email", "tel", "number", "select", "checkbox"]),
  required: z.boolean().default(false),
  helperText: z.string().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      minLength: z.number().int().positive().optional(),
      maxLength: z.number().int().positive().optional(),
      message: z.string().optional()
    })
    .optional(),
  options: z.array(z.string().min(1)).optional(),
  capturePartial: z.boolean().default(false)
});

export const leadCaptureStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  fields: z.array(fieldSchema).min(1),
  branch: z
    .object({
      field: z.string().min(1),
      equals: z.union([z.string(), z.number(), z.boolean()]),
      nextStepId: z.string().min(1)
    })
    .optional()
});

export const trackingEventNameSchema = z.enum([
  "PageView",
  "LeadStarted",
  "LeadStepCompleted",
  "LeadCompleted",
  "LeadQualified",
  "ViewContent",
  "article_viewed",
  "cta_clicked",
  "quiz_started_from_article",
  "lead_captured_from_article",
  "phone_captured_from_article",
  "advisor_assigned_from_article"
]);

const stateCodeSchema = z.string().regex(/^[A-Z]{2}$/);

export const complianceSchema = z.object({
  firmName: z.string().min(1),
  crdNumber: z.string().regex(/^\d{3,8}$/),
  advisorName: z.string().min(1),
  advisorTitle: z.string().min(1),
  statesLicensed: z.array(stateCodeSchema).min(1),
  brokerCheckUrl: z.string().url(),
  adv2Url: z.string().url(),
  privacyPolicyUrl: z.string().url(),
  disclosureFooter: z.string().min(20),
  calculatorDisclosure: z.string().min(20),
  requireStateGating: z.boolean().default(false),
  unlicensedStateMessage: z
    .string()
    .default(
      "We're not currently licensed to serve clients in {state}. You can find advisors who are at brokercheck.finra.org."
    )
});

export const contentSchema = z.object({
  hero: z.object({
    headline: z.string().min(1),
    subheadline: z.string().min(1),
    ctaLabel: z.string().min(1)
  }),
  about: z.object({
    firmStoryParagraphs: z.array(z.string().min(1)).min(1),
    advisorBioParagraphs: z.array(z.string().min(1)).min(1),
    photoUrl: z.string().url().optional(),
    credentials: z.array(z.string().min(1))
  }),
  services: z.object({
    items: z
      .array(
        z.object({
          title: z.string().min(1),
          description: z.string().min(1),
          icon: z.string().min(1)
        })
      )
      .min(1)
  }),
  socialProof: z.object({
    clientsServed: z.string().optional(),
    yearsInPractice: z.string().optional(),
    statesLicensedCount: z.string().optional()
  }),
  insights: z
    .array(
      z.object({
        category: z.string().min(1),
        headline: z.string().min(1),
        excerpt: z.string().min(1),
        date: z.string().min(1)
      })
    )
    .optional(),
  schedulingUrl: z.string().url()
});

export const calculatorSchema = z.object({
  formulaId: z.enum(["retirementIncome"]),
  resultDisplay: z.object({
    headline: z.string().min(1),
    primaryMetricLabel: z.string().min(1),
    primaryMetricFormat: z.enum(["currencyRange", "currency", "number"]),
    lowLabel: z.string().min(1),
    highLabel: z.string().min(1),
    ctaLabel: z.string().min(1)
  }),
  assumptions: z.string().min(1)
});

export const tenantConfigSchema = z.object({
  identity: z.object({
    tenantId: z.string().uuid(),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(1),
    primaryDomain: z.string().min(1)
  }),
  branding: z.object({
    logoText: z.string().min(1),
    primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/)
  }),
  domains: z.array(z.string().min(1)).min(1),
  tracking: z.object({
    gtmContainerId: z.string().optional(),
    metaPixelId: z.string().optional(),
    metaAccessTokenEnv: z.string().optional(),
    googleAdsConversionId: z.string().optional(),
    googleAdsConversionLabel: z.string().optional(),
    googleAdsEnhancedConversionsEndpoint: z.string().url().optional(),
    eventMappings: z
      .record(
        trackingEventNameSchema,
        z.object({
          meta: z.string().optional(),
          googleAds: z.string().optional(),
          gtm: z.string().optional()
        })
      )
      .default({})
  }),
  leadCapture: z.object({
    type: z.enum(["quiz", "calculator", "multiStepForm", "singleForm"]),
    headline: z.string().min(1),
    subheadline: z.string().min(1),
    steps: z.array(leadCaptureStepSchema).min(1)
  }),
  email: z.object({
    fromAddress: z.string().email(),
    fromName: z.string().min(1),
    sequences: z.array(
      z.object({
        id: z.string().min(1),
        subject: z.string().min(1),
        delayHours: z.number().int().nonnegative(),
        template: z.string().min(1),
        condition: z.enum(["always", "qualified", "nurture"]).default("always"),
        variants: z
          .array(
            z.object({
              id: z.string().min(1),
              subject: z.string().min(1),
              template: z.string().min(1)
            })
          )
          .optional()
      })
    )
  }),
  scoring: z.object({
    rules: z.array(
      z.object({
        field: z.string().min(1),
        operator: z.enum(["equals", "notEquals", "contains", "greaterThan", "lessThan"]),
        value: z.union([z.string(), z.number(), z.boolean()]),
        points: z.number().int(),
        reason: z.string().min(1).optional()
      })
    ),
    qualifiedThreshold: z.number().int()
  }),
  crm: z.object({
    provider: z.enum(["hubspot", "salesforce", "gohighlevel", "none"]),
    apiKeyEnv: z.string().optional(),
    pipelineId: z.string().optional(),
    defaultStage: z.string().optional(),
    listId: z.string().optional(),
    propertyMappings: z.record(z.string())
  }),
  notifications: z.object({
    ownerEmail: z.string().email(),
    fromAddress: z.string().email().optional(),
    slackWebhookUrl: z.string().url().optional(),
    highScoreThreshold: z.number().int()
  }),
  compliance: complianceSchema.optional(),
  content: contentSchema.optional(),
  calculator: calculatorSchema.optional()
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type TenantConfigInput = z.input<typeof tenantConfigSchema>;

export function defineTenantConfig(config: TenantConfigInput): TenantConfig {
  return tenantConfigSchema.parse(config);
}
