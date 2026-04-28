import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantConfig } from "@ble/tenant-schema";
import { emitTrackingEvent, type TrackingRequest } from "../tracking";
import { leadSubmissionSchema, validateLeadFields, type LeadSubmissionResult } from "./schema";

type LeadPipelineOptions = {
  supabase: SupabaseClient;
  tenant: TenantConfig;
  submission: unknown;
  trackingContext?: Pick<TrackingRequest, "clientIp" | "userAgent">;
};

type InsertedLead = {
  id: string;
};

export async function submitLead(options: LeadPipelineOptions): Promise<LeadSubmissionResult> {
  const parsed = leadSubmissionSchema.parse(options.submission);
  const fields = validateLeadFields(options.tenant, parsed.fields);
  const eventId = crypto.randomUUID();

  const email = typeof fields.email === "string" ? fields.email : null;
  const phone = typeof fields.phone === "string" ? fields.phone : null;

  const { data, error } = await options.supabase
    .from("leads")
    .insert({
      tenant_id: options.tenant.identity.tenantId,
      email,
      phone,
      status: parsed.isPartial ? "partial" : "new",
      source: parsed.source,
      data: fields
    })
    .select("id")
    .single<InsertedLead>();

  if (error) {
    throw new Error(`Lead insert failed: ${error.message}`);
  }

  const leadId = data.id;

  await emitTrackingEvent({
    tenant: options.tenant,
    eventName: parsed.isPartial ? "LeadStarted" : "LeadCompleted",
    eventId,
    leadId,
    payload: {
      stepId: parsed.stepId,
      fields
    },
    ...options.trackingContext
  });

  return {
    leadId,
    eventId,
    isPartial: parsed.isPartial
  };
}
