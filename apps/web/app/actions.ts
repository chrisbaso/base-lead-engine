"use server";

import { headers } from "next/headers";
import { verifyTurnstile } from "@ble/core/bot-protection";
import { captureException } from "@ble/core/error-tracking";
import type { CaptureValues } from "@ble/core/lead-capture/components";
import { submitLead } from "@ble/core/lead-capture/pipeline";
import { logEvent } from "@ble/core/logger";
import { enforceRateLimit } from "@ble/core/rate-limit";
import { getTenantConfig, resolveTenantSlug } from "@ble/core/tenant-config";
import { getSupabaseClient } from "@ble/db";
import { resolveHvacExperimentAssignment } from "@ble/tenant-hvac-ops-pro/experiments";
import { recommendHvacSoftware } from "@ble/tenant-hvac-ops-pro/lib/recommendation-engine";
import { calculateRetirementIncomeScore } from "@ble/tenant-retire-ready-mn/lib/retirement-score-engine";
import type { PrimaryConcern, SavingsBucket } from "@ble/tenant-retire-ready-mn/lib/retirement-score-engine";

type LeadSourceInput = {
  url?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  quizVariant?: string;
  emailVariant?: string;
  heroVariant?: string;
  quizFrame?: string;
  articleSlug?: string;
  articleCategory?: string;
  ctaVariant?: string;
};

type RetireReadyContentEventType =
  | "article_viewed"
  | "cta_clicked"
  | "quiz_started_from_article"
  | "lead_captured_from_article"
  | "phone_captured_from_article"
  | "advisor_assigned_from_article";

type PerformanceCounterField =
  | "views"
  | "cta_clicks"
  | "quiz_starts"
  | "lead_captures"
  | "phone_captures"
  | "advisor_assignments";

const contentEventCounters: Record<RetireReadyContentEventType, PerformanceCounterField> = {
  article_viewed: "views",
  cta_clicked: "cta_clicks",
  quiz_started_from_article: "quiz_starts",
  lead_captured_from_article: "lead_captures",
  phone_captured_from_article: "phone_captures",
  advisor_assigned_from_article: "advisor_assignments"
};

export async function submitLeadAction(input: {
  fields: CaptureValues;
  stepId?: string;
  isPartial: boolean;
  source?: LeadSourceInput;
  botToken?: string;
}) {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const tenant = getTenantConfig(process.env.TENANT_SLUG ?? resolveTenantSlug(host));
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim();
  const userAgent = headerList.get("user-agent") ?? undefined;
  const rateLimitKey = ipAddress ?? input.fields.email?.toString() ?? "anonymous";
  const appUrl = getAppUrl(headerList, host);
  const fields = enrichTenantFields(tenant.identity.slug, input.fields, input.source);

  try {
    const rateLimit = await enforceRateLimit({
      key: `lead-submit:${rateLimitKey}`,
      limit: input.isPartial ? 30 : 10,
      windowSeconds: 60,
      tenantId: tenant.identity.tenantId
    });

    if (!rateLimit.allowed) {
      logEvent("warn", "Lead submission rate limited", {
        tenant_id: tenant.identity.tenantId,
        remaining: rateLimit.remaining,
        reset_at: rateLimit.resetAt.toISOString()
      });
      throw new Error("Too many submissions. Please try again in a minute.");
    }

    if (!input.isPartial) {
      const botVerified = await verifyTurnstile({
        ...(input.botToken ? { token: input.botToken } : {}),
        ...(ipAddress ? { remoteIp: ipAddress } : {})
      });

      if (!botVerified) {
        logEvent("warn", "Lead submission failed bot verification", {
          tenant_id: tenant.identity.tenantId,
          host
        });
        throw new Error("Bot verification failed. Please refresh and try again.");
      }
    }

    logEvent("info", "Lead submission accepted", {
      tenant_id: tenant.identity.tenantId,
      is_partial: input.isPartial,
      step_id: input.stepId
    });

    const supabase = getSupabaseClient("service");
    const result = await submitLead({
      supabase,
      tenant,
      submission: {
        tenantId: tenant.identity.tenantId,
        fields,
        stepId: input.stepId,
        isPartial: input.isPartial,
        source: {
          ...input.source,
          userAgent,
          ipAddress
        }
      },
      trackingContext: Object.fromEntries(
        Object.entries({
          clientIp: ipAddress,
          userAgent
        }).filter((entry): entry is [string, string] => typeof entry[1] === "string")
      ),
      ...(tenant.identity.slug === "hvac-ops-pro" || tenant.identity.slug === "retire-ready-mn"
        ? {
            immediateEmail: {
              appUrl,
              resendApiKey: process.env.RESEND_API_KEY
            }
          }
        : {})
    });

    if (!input.isPartial && tenant.identity.slug === "retire-ready-mn" && input.source?.articleSlug) {
      await recordRetireReadyContentEvent({
        supabase,
        tenantId: tenant.identity.tenantId,
        leadId: result.leadId,
        eventType: "phone_captured_from_article",
        source: input.source
      });
    }

    return result;
  } catch (error) {
    await captureException(error, {
      tenant_id: tenant.identity.tenantId,
      action: "submitLeadAction",
      is_partial: input.isPartial
    });
    throw error;
  }
}

export async function recordRetireReadyStepAction(input: {
  fields: CaptureValues;
  stepId: string;
  source?: LeadSourceInput;
}) {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const tenant = getTenantConfig(process.env.TENANT_SLUG ?? resolveTenantSlug(host));

  if (tenant.identity.slug !== "retire-ready-mn") {
    return { recorded: false };
  }

  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim();
  const supabase = getSupabaseClient("service");
  const email = stringField(input.fields.email);
  let leadId: string | null = null;

  if (email) {
    const { data, error } = await supabase
      .from("leads")
      .upsert(
        {
          tenant_id: tenant.identity.tenantId,
          email,
          phone: stringField(input.fields.phone) ?? null,
          status: "partial",
          score: numberField(input.fields.retirementScore) ?? 0,
          source: {
            ...input.source,
            userAgent: headerList.get("user-agent") ?? undefined,
            ipAddress
          },
          data: input.fields,
          first_name: stringField(input.fields.firstName) ?? null,
          last_name: stringField(input.fields.lastName) ?? null,
          age: numberField(input.fields.currentAge),
          current_savings: numberField(input.fields.currentSavings),
          target_retirement_age: numberField(input.fields.targetRetirementAge),
          monthly_social_security: numberField(input.fields.monthlySocialSecurity),
          desired_monthly_income: numberField(input.fields.desiredMonthlyIncome),
          retirement_score: numberField(input.fields.retirementScore),
          score_band: stringField(input.fields.scoreBand) ?? null,
          quiz_answers: input.fields,
          utm_source: input.source?.utmSource,
          utm_campaign: input.source?.utmCampaign,
          utm_content: input.source?.utmContent,
          updated_at: new Date().toISOString()
        },
        { onConflict: "tenant_id,email", ignoreDuplicates: false }
      )
      .select("id")
      .single<{ id: string }>();

    if (error) {
      throw new Error(`RetireReadyMN partial lead upsert failed: ${error.message}`);
    }

    leadId = data.id;
  }

  const metadata = {
    stepId: input.stepId,
    fields: input.fields,
    source: {
      ...input.source,
      userAgent: headerList.get("user-agent") ?? undefined,
      ipAddress
    }
  };

  const [{ error: leadEventError }, { error: eventError }] = await Promise.all([
    supabase.from("lead_events").insert({
      tenant_id: tenant.identity.tenantId,
      lead_id: leadId,
      event_name: "LeadStepCompleted",
      event_id: crypto.randomUUID(),
      payload: metadata
    }),
    supabase.from("events").insert({
      tenant_id: tenant.identity.tenantId,
      lead_id: leadId,
      event_type: "LeadStepCompleted",
      metadata
    })
  ]);

  if (leadEventError) {
    throw new Error(`RetireReadyMN lead event insert failed: ${leadEventError.message}`);
  }

  if (eventError) {
    throw new Error(`RetireReadyMN analytics event insert failed: ${eventError.message}`);
  }

  if (input.stepId === "email-gate" && input.source?.articleSlug) {
    await recordRetireReadyContentEvent({
      supabase,
      tenantId: tenant.identity.tenantId,
      leadId,
      eventType: "lead_captured_from_article",
      source: input.source
    });
  }

  return { recorded: true, leadId };
}

export async function recordRetireReadyContentEventAction(input: {
  eventType: RetireReadyContentEventType;
  articleSlug: string;
  articleCategory?: string;
  ctaVariant?: string;
  metadata?: Record<string, unknown>;
}) {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const tenant = getTenantConfig(process.env.TENANT_SLUG ?? resolveTenantSlug(host));

  if (tenant.identity.slug !== "retire-ready-mn") {
    return { recorded: false };
  }

  const eventType = input.eventType;
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim();
  const supabase = getSupabaseClient("service");
  const source = Object.fromEntries(
    Object.entries({
      url: typeof input.metadata?.url === "string" ? input.metadata.url : undefined,
      referrer: headerList.get("referer") ?? undefined,
      articleSlug: input.articleSlug,
      articleCategory: input.articleCategory,
      ctaVariant: input.ctaVariant
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  ) as LeadSourceInput;

  await recordRetireReadyContentEvent({
    supabase,
    tenantId: tenant.identity.tenantId,
    eventType,
    source,
    metadata: {
      ...input.metadata,
      userAgent: headerList.get("user-agent") ?? undefined,
      ipAddress
    }
  });

  return { recorded: true };
}

function enrichTenantFields(
  tenantSlug: string,
  fields: CaptureValues,
  source: { quizVariant?: string; emailVariant?: string } | undefined
): CaptureValues {
  if (tenantSlug !== "hvac-ops-pro") {
    if (tenantSlug !== "retire-ready-mn") {
      return fields;
    }

    const result = calculateRetireReadyScore(fields);
    if (!result) {
      return fields;
    }

    return {
      ...fields,
      currentSavings: result.currentSavingsEstimate,
      projectedMonthlyPortfolioIncome: result.projectedMonthlyPortfolioIncome,
      projectedMonthlyIncome: result.projectedMonthlyIncome,
      monthlyIncomeGap: result.monthlyGap,
      retirementScore: result.score,
      scoreBand: result.band
    };
  }

  const assignment = resolveHvacExperimentAssignment({
    quizVariant: stringField(fields.quizVariant) ?? source?.quizVariant,
    emailVariant: stringField(fields.emailVariant) ?? source?.emailVariant
  });
  const recommendation = recommendHvacSoftware({
    teamSize: stringField(fields.teamSize),
    biggestHeadache: stringField(fields.biggestHeadache),
    usingSoftware: stringField(fields.usingSoftware),
    currentSoftware: stringField(fields.currentSoftware),
    monthlyRevenueRange: stringField(fields.monthlyRevenueRange),
    firstName: stringField(fields.firstName),
    email: stringField(fields.email)
  });

  return {
    ...fields,
    recommendedPlatformId: recommendation.platformId,
    recommendedSoftware: recommendation.platformName,
    recommendationReason: recommendation.reason,
    affiliateEnvVar: recommendation.affiliateEnvVar,
    quizVariant: assignment.quizVariant,
    emailVariant: assignment.emailVariant
  };
}

function calculateRetireReadyScore(fields: CaptureValues) {
  const currentSavingsBucket = stringField(fields.currentSavingsBucket);
  const primaryConcern = stringField(fields.primaryConcern);

  if (!isSavingsBucket(currentSavingsBucket) || !isPrimaryConcern(primaryConcern)) {
    return null;
  }

  return calculateRetirementIncomeScore({
    currentAge: numberField(fields.currentAge) ?? 0,
    targetRetirementAge: numberField(fields.targetRetirementAge) ?? 0,
    currentSavingsBucket,
    monthlySocialSecurity: numberField(fields.monthlySocialSecurity) ?? 0,
    desiredMonthlyIncome: numberField(fields.desiredMonthlyIncome) ?? 0,
    primaryConcern
  });
}

async function recordRetireReadyContentEvent({
  supabase,
  tenantId,
  eventType,
  leadId = null,
  source,
  metadata = {}
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  tenantId: string;
  eventType: RetireReadyContentEventType;
  leadId?: string | null;
  source?: LeadSourceInput;
  metadata?: Record<string, unknown>;
}) {
  const articleSlug = source?.articleSlug;
  if (!articleSlug) {
    return;
  }

  const payload = {
    ...metadata,
    articleSlug,
    articleCategory: source.articleCategory,
    ctaVariant: source.ctaVariant,
    source
  };

  const { error } = await supabase.from("events").insert({
    tenant_id: tenantId,
    lead_id: leadId,
    event_type: eventType,
    metadata: payload
  });

  if (error) {
    throw new Error(`RetireReadyMN content event insert failed: ${error.message}`);
  }

  await incrementContentPerformance({ supabase, tenantId, articleSlug, eventType });
}

async function incrementContentPerformance({
  supabase,
  tenantId,
  articleSlug,
  eventType
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  tenantId: string;
  articleSlug: string;
  eventType: RetireReadyContentEventType;
}) {
  const counterField = contentEventCounters[eventType];
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("content_performance")
    .select("id, views, cta_clicks, quiz_starts, lead_captures, phone_captures, advisor_assignments")
    .eq("tenant_id", tenantId)
    .eq("slug", articleSlug)
    .maybeSingle<
      {
        id: string;
      } & Record<PerformanceCounterField, number | null>
    >();

  if (error) {
    throw new Error(`RetireReadyMN content performance lookup failed: ${error.message}`);
  }

  if (!data) {
    const { error: insertError } = await supabase.from("content_performance").insert({
      tenant_id: tenantId,
      slug: articleSlug,
      [counterField]: 1,
      last_event_at: now,
      updated_at: now
    });

    if (insertError) {
      throw new Error(`RetireReadyMN content performance insert failed: ${insertError.message}`);
    }

    return;
  }

  const { error: updateError } = await supabase
    .from("content_performance")
    .update({
      [counterField]: (data[counterField] ?? 0) + 1,
      last_event_at: now,
      updated_at: now
    })
    .eq("id", data.id);

  if (updateError) {
    throw new Error(`RetireReadyMN content performance update failed: ${updateError.message}`);
  }
}

function stringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function numberField(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function isSavingsBucket(value: string | undefined): value is SavingsBucket {
  return (
    value === "under-250000" ||
    value === "250000-500000" ||
    value === "500000-1000000" ||
    value === "1000000-2000000" ||
    value === "over-2000000"
  );
}

function isPrimaryConcern(value: string | undefined): value is PrimaryConcern {
  return (
    value === "outliving_savings" ||
    value === "market_crash" ||
    value === "taxes" ||
    value === "leaving_legacy" ||
    value === "healthcare_costs"
  );
}

function getAppUrl(headerList: { get(name: string): string | null }, host: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
