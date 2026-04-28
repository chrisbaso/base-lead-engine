"use server";

import { headers } from "next/headers";
import type { CaptureValues } from "@ble/core/lead-capture/components";
import { submitLead } from "@ble/core/lead-capture/pipeline";
import { getTenantConfig, resolveTenantSlug } from "@ble/core/tenant-config";
import { getSupabaseClient } from "@ble/db";

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
  };
}) {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const tenant = getTenantConfig(process.env.TENANT_SLUG ?? resolveTenantSlug(host));
  const forwardedFor = headerList.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0]?.trim();
  const userAgent = headerList.get("user-agent") ?? undefined;

  return submitLead({
    supabase: getSupabaseClient("service"),
    tenant,
    submission: {
      tenantId: tenant.identity.tenantId,
      fields: input.fields,
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
    )
  });
}
