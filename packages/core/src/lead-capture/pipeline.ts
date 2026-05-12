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
  const lastName = typeof fields.lastName === "string" ? fields.lastName : null;
  const recommendedSoftware =
    typeof fields.recommendedSoftware === "string" ? fields.recommendedSoftware : null;
  const quizVariant = typeof fields.quizVariant === "string" ? fields.quizVariant : null;
  const emailVariant = typeof fields.emailVariant === "string" ? fields.emailVariant : null;
  const currentAge = readNumberField(fields.currentAge);
  const currentSavings = readNumberField(fields.currentSavings);
  const targetRetirementAge = readNumberField(fields.targetRetirementAge);
  const monthlySocialSecurity = readNumberField(fields.monthlySocialSecurity);
  const desiredMonthlyIncome = readNumberField(fields.desiredMonthlyIncome);
  const retirementScore = readNumberField(fields.retirementScore);
  const scoreBand = typeof fields.scoreBand === "string" ? fields.scoreBand : null;
  const incomePreference = typeof fields.incomePreference === "string" ? fields.incomePreference : null;
  const annuityIntentScore = readNumberField(fields.annuityIntentScore);
  const annuityIntentBand = typeof fields.annuityIntentBand === "string" ? fields.annuityIntentBand : null;
  const annuityIntentSegment =
    typeof fields.annuityIntentSegment === "string" ? fields.annuityIntentSegment : null;
  const annuityIntentReasons = Array.isArray(fields.annuityIntentReasons)
    ? fields.annuityIntentReasons.filter((reason): reason is string => typeof reason === "string")
    : [];
  const automationPriority = typeof fields.automationPriority === "string" ? fields.automationPriority : null;
  const recommendedAction = typeof fields.recommendedAction === "string" ? fields.recommendedAction : null;
  const nextBestEmailId = typeof fields.nextBestEmailId === "string" ? fields.nextBestEmailId : null;
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
        last_name: lastName,
        age: currentAge,
        current_savings: currentSavings,
        target_retirement_age: targetRetirementAge,
        monthly_social_security: monthlySocialSecurity,
        desired_monthly_income: desiredMonthlyIncome,
        retirement_score: retirementScore,
        score_band: scoreBand,
        income_preference: incomePreference,
        annuity_intent_score: annuityIntentScore,
        annuity_intent_band: annuityIntentBand,
        annuity_intent_segment: annuityIntentSegment,
        annuity_intent_reasons: annuityIntentReasons,
        automation_priority: automationPriority,
        recommended_action: recommendedAction,
        next_best_email_id: nextBestEmailId,
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

function readNumberField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}
