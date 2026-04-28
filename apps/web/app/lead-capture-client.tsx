"use client";

import { useMemo } from "react";
import { Quiz, type CaptureValues } from "@ble/core/lead-capture/components";
import { getClientTrackingConfig } from "@ble/core/tracking";
import type { TenantConfig } from "@ble/tenant-schema";
import { submitLeadAction } from "./actions";

type LeadCaptureClientProps = {
  tenant: TenantConfig;
};

function readSource() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    Object.entries({
      url: window.location.href,
      referrer: document.referrer || undefined,
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function emitClientFallback(eventName: string, payload: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("ble:tracking", { detail: { eventName, payload } }));
}

export function LeadCaptureClient({ tenant }: LeadCaptureClientProps) {
  const tracking = useMemo(() => getClientTrackingConfig(tenant), [tenant]);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  async function handleSubmit(payload: {
    fields: CaptureValues;
    stepId?: string;
    isPartial: boolean;
    botToken?: string;
  }) {
    emitClientFallback(payload.isPartial ? "LeadStepCompleted" : "LeadCompleted", {
      stepId: payload.stepId,
      eventMappings: tracking.eventMappings
    });

    await submitLeadAction({
      ...payload,
      source: readSource()
    });
  }

  return <Quiz tenant={tenant} onSubmit={handleSubmit} {...(turnstileSiteKey ? { botProtectionSiteKey: turnstileSiteKey } : {})} />;
}
