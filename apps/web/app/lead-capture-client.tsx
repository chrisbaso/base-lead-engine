"use client";

import { useEffect, useMemo, useState } from "react";
import { Quiz, type CaptureValues } from "@ble/core/lead-capture/components";
import { getClientTrackingConfig } from "@ble/core/tracking";
import type { TenantConfig } from "@ble/tenant-schema";
import {
  hvacFirstEmailVariations,
  hvacQuizCopyVariations
} from "@ble/tenant-hvac-ops-pro/copy";
import {
  resolveHvacExperimentAssignment,
  type HvacExperimentAssignment
} from "@ble/tenant-hvac-ops-pro/experiments";
import { submitLeadAction } from "./actions";

type LeadCaptureClientProps = {
  tenant: TenantConfig;
  initialQuizVariant?: string;
  initialEmailVariant?: string;
};

const HVAC_ASSIGNMENT_STORAGE_KEY = "ble:hvac-ops-pro:experiment-assignment";

function readSource(assignment?: HvacExperimentAssignment) {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(
    Object.entries({
      url: window.location.href,
      referrer: document.referrer || undefined,
      utmSource: params.get("utm_source") ?? undefined,
      utmMedium: params.get("utm_medium") ?? undefined,
      utmCampaign: params.get("utm_campaign") ?? undefined,
      utmContent: params.get("utm_content") ?? undefined,
      quizVariant: assignment?.quizVariant,
      emailVariant: assignment?.emailVariant
    }).filter((entry): entry is [string, string] => typeof entry[1] === "string")
  );
}

function emitClientFallback(eventName: string, payload: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("ble:tracking", { detail: { eventName, payload } }));
}

export function LeadCaptureClient({ tenant, initialQuizVariant, initialEmailVariant }: LeadCaptureClientProps) {
  const tracking = useMemo(() => getClientTrackingConfig(tenant), [tenant]);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const assignment = useHvacExperimentAssignment(tenant.identity.slug, {
    quizVariant: initialQuizVariant,
    emailVariant: initialEmailVariant
  });

  async function handleSubmit(payload: {
    fields: CaptureValues;
    stepId?: string;
    isPartial: boolean;
    botToken?: string;
  }) {
    emitClientFallback(payload.isPartial ? "LeadStepCompleted" : "LeadCompleted", {
      stepId: payload.stepId,
      quizVariant: assignment?.quizVariant,
      emailVariant: assignment?.emailVariant,
      eventMappings: tracking.eventMappings
    });

    await submitLeadAction({
      ...payload,
      fields: {
        ...payload.fields,
        ...(assignment
          ? {
              quizVariant: assignment.quizVariant,
              emailVariant: assignment.emailVariant
            }
          : {})
      },
      source: readSource(assignment)
    });
  }

  return <Quiz tenant={tenant} onSubmit={handleSubmit} {...(turnstileSiteKey ? { botProtectionSiteKey: turnstileSiteKey } : {})} />;
}

function useHvacExperimentAssignment(
  tenantSlug: string,
  initial: { quizVariant?: string | undefined; emailVariant?: string | undefined }
): HvacExperimentAssignment | undefined {
  const [assignment] = useState<HvacExperimentAssignment | undefined>(() => {
    if (tenantSlug !== "hvac-ops-pro" || typeof window === "undefined") {
      return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    const stored = readStoredHvacAssignment();
    return resolveHvacExperimentAssignment({
      quizVariant: params.get("quiz_variant") ?? initial.quizVariant ?? stored?.quizVariant ?? randomQuizVariant(),
      emailVariant: params.get("email_variant") ?? initial.emailVariant ?? stored?.emailVariant ?? randomEmailVariant()
    });
  });

  useEffect(() => {
    if (assignment) {
      window.localStorage.setItem(HVAC_ASSIGNMENT_STORAGE_KEY, JSON.stringify(assignment));
    }
  }, [assignment]);

  return assignment;
}

function readStoredHvacAssignment(): HvacExperimentAssignment | undefined {
  const raw = window.localStorage.getItem(HVAC_ASSIGNMENT_STORAGE_KEY);
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<HvacExperimentAssignment>;
    return resolveHvacExperimentAssignment({
      quizVariant: parsed.quizVariant,
      emailVariant: parsed.emailVariant
    });
  } catch {
    return undefined;
  }
}

function randomQuizVariant() {
  const index = Math.floor(Math.random() * hvacQuizCopyVariations.length);
  return hvacQuizCopyVariations[index]?.id;
}

function randomEmailVariant() {
  const index = Math.floor(Math.random() * hvacFirstEmailVariations.length);
  return hvacFirstEmailVariations[index]?.id;
}
