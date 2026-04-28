import { z } from "zod";
import type { TenantConfig } from "@ble/tenant-schema";

export const leadSourceSchema = z.object({
  url: z.string().url().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional()
});

export const leadSubmissionSchema = z.object({
  tenantId: z.string().uuid(),
  stepId: z.string().min(1).optional(),
  isPartial: z.boolean().default(false),
  fields: z.record(z.union([z.string(), z.number(), z.boolean()])),
  source: leadSourceSchema.default({})
});

export type LeadSubmission = z.infer<typeof leadSubmissionSchema>;
export type LeadSubmissionResult = {
  leadId: string;
  eventId: string;
  isPartial: boolean;
};

export function buildSubmissionSchema(tenant: TenantConfig) {
  const shape: Record<string, z.ZodType<unknown>> = {};

  for (const step of tenant.leadCapture.steps) {
    for (const field of step.fields) {
      const baseSchema = field.type === "number" ? z.coerce.number() : z.string().trim();
      const withType =
        field.type === "email"
          ? z.string().trim().email()
          : field.type === "checkbox"
            ? z.coerce.boolean()
            : baseSchema;

      shape[field.id] = field.required ? withType : withType.optional().or(z.literal(""));
    }
  }

  return z.object(shape);
}

export function validateLeadFields(tenant: TenantConfig, fields: Record<string, unknown>) {
  return buildSubmissionSchema(tenant).parse(fields);
}
