import { z } from "zod";

export const fieldSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "email", "tel", "number", "select", "checkbox"]),
  required: z.boolean().default(false),
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
  "LeadQualified"
]);

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
    sequences: z.array(
      z.object({
        id: z.string().min(1),
        delayHours: z.number().int().nonnegative(),
        template: z.string().min(1),
        condition: z.string().optional()
      })
    )
  }),
  scoring: z.object({
    rules: z.array(
      z.object({
        field: z.string().min(1),
        operator: z.enum(["equals", "notEquals", "contains", "greaterThan", "lessThan"]),
        value: z.union([z.string(), z.number(), z.boolean()]),
        points: z.number().int()
      })
    ),
    qualifiedThreshold: z.number().int()
  }),
  crm: z.object({
    provider: z.enum(["hubspot", "salesforce", "gohighlevel", "none"]),
    pipelineId: z.string().optional(),
    defaultStage: z.string().optional(),
    propertyMappings: z.record(z.string())
  }),
  notifications: z.object({
    ownerEmail: z.string().email(),
    slackWebhookUrl: z.string().url().optional(),
    highScoreThreshold: z.number().int()
  })
});

export type TenantConfig = z.infer<typeof tenantConfigSchema>;
export type TenantConfigInput = z.input<typeof tenantConfigSchema>;

export function defineTenantConfig(config: TenantConfigInput): TenantConfig {
  return tenantConfigSchema.parse(config);
}
