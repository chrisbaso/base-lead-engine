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

export async function submitLeadAction(input: {
  fields: CaptureValues;
  stepId?: string;
  isPartial: boolean;
  source?: {
    url?: string;
    referrer?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    utmContent?: string;
    quizVariant?: string;
    emailVariant?: string;
  };
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

    return await submitLead({
      supabase: getSupabaseClient("service"),
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
      ...(tenant.identity.slug === "hvac-ops-pro"
        ? {
            immediateEmail: {
              appUrl,
              resendApiKey: process.env.RESEND_API_KEY
            }
          }
        : {})
    });
  } catch (error) {
    await captureException(error, {
      tenant_id: tenant.identity.tenantId,
      action: "submitLeadAction",
      is_partial: input.isPartial
    });
    throw error;
  }
}

function enrichTenantFields(
  tenantSlug: string,
  fields: CaptureValues,
  source: { quizVariant?: string; emailVariant?: string } | undefined
): CaptureValues {
  if (tenantSlug !== "hvac-ops-pro") {
    return fields;
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

function stringField(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getAppUrl(headerList: { get(name: string): string | null }, host: string): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  const protocol = headerList.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
