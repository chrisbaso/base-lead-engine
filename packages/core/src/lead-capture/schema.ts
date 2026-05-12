import { z } from "zod";
import type { TenantConfig } from "@ble/tenant-schema";

export const leadSourceSchema = z.object({
  url: z.string().url().optional(),
  referrer: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  utmContent: z.string().optional(),
  quizVariant: z.string().optional(),
  emailVariant: z.string().optional(),
  heroVariant: z.string().optional(),
  quizFrame: z.string().optional(),
  articleSlug: z.string().optional(),
  articleCategory: z.string().optional(),
  ctaVariant: z.string().optional(),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional()
});

export const leadSubmissionSchema = z.object({
  tenantId: z.string().uuid(),
  stepId: z.string().min(1).optional(),
  isPartial: z.boolean().default(false),
  fields: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])),
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
      const message = field.validation?.message;
      const numberSchema = z.coerce.number();
      const stringSchema = z.string().trim();
      const baseSchema = field.type === "number" ? numberSchema : stringSchema;
      const withType =
        field.type === "email"
          ? z.string().trim().email()
          : field.type === "checkbox"
            ? z.coerce.boolean()
            : baseSchema;

      let withValidation: z.ZodType<unknown> = withType;

      if (field.type === "number") {
        let numberWithValidation = z.coerce.number();
        if (typeof field.validation?.min === "number") {
          numberWithValidation = numberWithValidation.min(field.validation.min, message);
        }
        if (typeof field.validation?.max === "number") {
          numberWithValidation = numberWithValidation.max(field.validation.max, message);
        }
        withValidation = numberWithValidation;
      }

      if (field.type !== "number" && field.type !== "checkbox") {
        let stringBase =
          field.type === "email" ? z.string().trim().email(message) : z.string().trim();
        if (typeof field.validation?.minLength === "number") {
          stringBase = stringBase.min(field.validation.minLength, message);
        }
        if (typeof field.validation?.maxLength === "number") {
          stringBase = stringBase.max(field.validation.maxLength, message);
        }
        let stringWithValidation: z.ZodType<string> = stringBase;
        if (field.options) {
          stringWithValidation = stringWithValidation.refine((value) => field.options?.includes(value) ?? false, {
            message: message ?? "Please select a valid option"
          });
        }
        withValidation = stringWithValidation;
      }

      shape[field.id] = field.required ? withValidation : withValidation.optional().or(z.literal(""));
    }
  }

  return z.object(shape).passthrough();
}

export function validateLeadFields(tenant: TenantConfig, fields: Record<string, unknown>) {
  return buildSubmissionSchema(tenant).parse(fields);
}
