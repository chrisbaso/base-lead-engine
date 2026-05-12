import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantConfig } from "@ble/tenant-schema";
import { enqueueCrmSync } from "../crm-sync";
import { runDueEmailSends, scheduleEmailSequence } from "../email-engine";
import { computeLeadScore } from "../lead-scoring";
import { sendHighScoreNotification } from "../notifications";
import { emitTrackingEvent, type TrackingRequest } from "../tracking";
import { leadSubmissionSchema, validateLeadFields, type LeadSubmissionResult } from "./schema";

type LeadPipelineOptions = {
  supabase: SupabaseClient;
  tenant: TenantConfig;
  submission: unknown;
  trackingContext?: Pick<TrackingRequest, "clientIp" | "userAgent">;
  immediateEmail?: {
    appUrl: string;
    resendApiKey: string | undefined;
  };
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
  const firstName = typeof fields.firstName === "string" ? fields.firstName : null;
  const recommendedSoftware =
    typeof fields.recommendedSoftware === "string" ? fields.recommendedSoftware : null;
  const quizVariant = typeof fields.quizVariant === "string" ? fields.quizVariant : null;
  const emailVariant = typeof fields.emailVariant === "string" ? fields.emailVariant : null;
  const scoreResult = computeLeadScore(options.tenant, fields);

  const { data, error } = await options.supabase
    .from("leads")
    .upsert(
      {
        tenant_id: options.tenant.identity.tenantId,
        email,
        phone,
        status: parsed.isPartial ? "partial" : "new",
        score: scoreResult.score,
        source: parsed.source,
        data: fields,
        first_name: firstName,
        quiz_answers: options.tenant.leadCapture.type === "quiz" ? fields : {},
        recommended_software: recommendedSoftware,
        quiz_variant: quizVariant,
        email_variant: emailVariant,
        utm_source: parsed.source.utmSource,
        utm_campaign: parsed.source.utmCampaign,
        utm_content: parsed.source.utmContent,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: "tenant_id,email",
        ignoreDuplicates: false
      }
    )
    .select("id")
    .single<InsertedLead>();

  if (error) {
    throw new Error(`Lead upsert failed: ${error.message}`);
  }

  const leadId = data.id;

  const eventName = parsed.isPartial ? "LeadStarted" : "LeadCompleted";

  const { error: eventError } = await options.supabase.from("lead_events").insert({
      tenant_id: options.tenant.identity.tenantId,
      lead_id: leadId,
      event_name: eventName,
      event_id: eventId,
      payload: {
        stepId: parsed.stepId,
        fields,
        source: parsed.source
      }
    });

  if (eventError) {
    throw new Error(`Lead event insert failed: ${eventError.message}`);
  }

  await emitTrackingEvent({
    tenant: options.tenant,
    eventName,
    eventId,
    leadId,
    payload: {
      stepId: parsed.stepId,
      fields,
      source: parsed.source
    },
    ...options.trackingContext
  });

  const { error: analyticsEventError } = await options.supabase.from("events").insert({
    tenant_id: options.tenant.identity.tenantId,
    lead_id: leadId,
    event_type: eventName,
    metadata: {
      stepId: parsed.stepId,
      fields,
      source: parsed.source
    }
  });

  if (analyticsEventError) {
    throw new Error(`Analytics event insert failed: ${analyticsEventError.message}`);
  }

  if (!parsed.isPartial && email) {
    await scheduleEmailSequence({
      supabase: options.supabase,
      tenant: options.tenant,
      lead: {
        id: leadId,
        email,
        score: scoreResult.score,
        data: fields
      }
    });

    if (options.immediateEmail) {
      await runDueEmailSends({
        supabase: options.supabase,
        appUrl: options.immediateEmail.appUrl,
        resendApiKey: options.immediateEmail.resendApiKey,
        leadId,
        batchSize: 5
      });
    }

    await enqueueCrmSync({
      supabase: options.supabase,
      tenant: options.tenant,
      leadId,
      payload: fields
    });

    if (scoreResult.score >= options.tenant.notifications.highScoreThreshold) {
      await sendHighScoreNotification({
        tenant: options.tenant,
        notification: {
          leadId,
          email,
          score: scoreResult.score,
          reasons: scoreResult.reasons
        },
        resendApiKey: process.env.RESEND_API_KEY
      });
    }
  }

  return {
    leadId,
    eventId,
    isPartial: parsed.isPartial
  };
}
