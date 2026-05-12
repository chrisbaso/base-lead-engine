import type { TenantConfig } from "@ble/tenant-schema";
import { retryFetch } from "../retry";

export type StandardTrackingEvent =
  | "PageView"
  | "LeadStarted"
  | "LeadStepCompleted"
  | "LeadCompleted"
  | "LeadQualified"
  | "ViewContent";

export type TrackingRequest = {
  tenant: TenantConfig;
  eventName: StandardTrackingEvent;
  eventId: string;
  leadId?: string;
  payload: Record<string, unknown>;
  clientIp?: string;
  userAgent?: string;
};

type TrackingResult = {
  provider: "gtm" | "meta" | "googleAds";
  status: "skipped" | "sent";
};

export function getClientTrackingConfig(tenant: TenantConfig) {
  return {
    gtmContainerId: tenant.tracking.gtmContainerId,
    metaPixelId: tenant.tracking.metaPixelId,
    googleAdsConversionId: tenant.tracking.googleAdsConversionId,
    eventMappings: tenant.tracking.eventMappings
  };
}

export async function emitTrackingEvent(request: TrackingRequest): Promise<TrackingResult[]> {
  const [meta, googleAds] = await Promise.all([sendMetaCapi(request), sendGoogleEnhancedConversion(request)]);
  return [{ provider: "gtm", status: "skipped" }, meta, googleAds];
}

async function sendMetaCapi(request: TrackingRequest): Promise<TrackingResult> {
  const pixelId = request.tenant.tracking.metaPixelId;
  const tokenEnv = request.tenant.tracking.metaAccessTokenEnv;
  const accessToken = tokenEnv ? process.env[tokenEnv] : undefined;

  if (!pixelId || !accessToken) {
    return { provider: "meta", status: "skipped" };
  }

  const mappedName = request.tenant.tracking.eventMappings[request.eventName]?.meta ?? request.eventName;
  const response = await retryFetch(`https://graph.facebook.com/v21.0/${pixelId}/events`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      access_token: accessToken,
      data: [
        {
          event_name: mappedName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: request.eventId,
          action_source: "website",
          user_data: {
            client_ip_address: request.clientIp,
            client_user_agent: request.userAgent
          },
          custom_data: request.payload
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Meta CAPI failed with ${String(response.status)}`);
  }

  return { provider: "meta", status: "sent" };
}

async function sendGoogleEnhancedConversion(request: TrackingRequest): Promise<TrackingResult> {
  const endpoint = request.tenant.tracking.googleAdsEnhancedConversionsEndpoint;

  if (!endpoint) {
    return { provider: "googleAds", status: "skipped" };
  }

  const mappedName = request.tenant.tracking.eventMappings[request.eventName]?.googleAds ?? request.eventName;
  const response = await retryFetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      conversionId: request.tenant.tracking.googleAdsConversionId,
      conversionLabel: request.tenant.tracking.googleAdsConversionLabel,
      eventName: mappedName,
      eventId: request.eventId,
      leadId: request.leadId,
      payload: request.payload
    })
  });

  if (!response.ok) {
    throw new Error(`Google Enhanced Conversions failed with ${String(response.status)}`);
  }

  return { provider: "googleAds", status: "sent" };
}
