import { NextRequest, NextResponse } from "next/server";
import { emitTrackingEvent } from "@ble/core/tracking";
import { getTenantConfig, resolveTenantSlug } from "@ble/core/tenant-config";
import { getSupabaseClient } from "@ble/db";
import {
  getHvacAffiliateUrl,
  hvacPlatforms,
  isHvacPlatformId
} from "@ble/tenant-hvac-ops-pro/lib/recommendation-engine";

type AffiliateRouteContext = {
  params: Promise<{ platform: string }>;
};

export async function GET(request: NextRequest, context: AffiliateRouteContext) {
  const { platform } = await context.params;

  if (!isHvacPlatformId(platform)) {
    return NextResponse.json({ error: "Unknown affiliate platform" }, { status: 404 });
  }

  const requestUrl = new URL(request.url);
  const host = request.headers.get("host") ?? "localhost";
  const tenantSlug = requestUrl.searchParams.get("tenant") ?? process.env.TENANT_SLUG ?? resolveTenantSlug(host);
  const tenant = getTenantConfig(tenantSlug);
  const leadId = requestUrl.searchParams.get("lead_id");
  const eventId = crypto.randomUUID();
  const targetUrl = getHvacAffiliateUrl(platform);
  const platformName = hvacPlatforms[platform].platformName;
  const forwardedFor = request.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim();
  const userAgent = request.headers.get("user-agent") ?? undefined;

  await logAffiliateClick({
    tenantId: tenant.identity.tenantId,
    leadId,
    platform,
    platformName,
    targetUrl,
    eventId,
    ...(clientIp ? { clientIp } : {}),
    ...(userAgent ? { userAgent } : {})
  });

  try {
    await emitTrackingEvent({
      tenant,
      eventName: "ViewContent",
      eventId,
      ...(leadId ? { leadId } : {}),
      payload: {
        platform,
        platformName,
        source: "email_clickthrough"
      },
      ...(clientIp ? { clientIp } : {}),
      ...(userAgent ? { userAgent } : {})
    });
  } catch {
    // The redirect is the user-critical path; CAPI failures can be inspected from provider logs.
  }

  return new Response(
    renderRedirectHtml({
      targetUrl,
      platformName,
      ...(tenant.tracking.metaPixelId ? { pixelId: tenant.tracking.metaPixelId } : {})
    }),
    {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store"
    }
    }
  );
}

async function logAffiliateClick(options: {
  tenantId: string;
  leadId: string | null;
  platform: string;
  platformName: string;
  targetUrl: string;
  eventId: string;
  clientIp?: string;
  userAgent?: string;
}) {
  try {
    const supabase = getSupabaseClient("service");
    const leadId = options.leadId || null;
    await Promise.all([
      supabase.from("events").insert({
        tenant_id: options.tenantId,
        lead_id: leadId,
        event_type: "affiliate.clicked",
        metadata: {
          platform: options.platform,
          platformName: options.platformName,
          targetUrl: options.targetUrl,
          eventId: options.eventId,
          clientIp: options.clientIp,
          userAgent: options.userAgent
        }
      }),
      supabase.from("lead_events").insert({
        tenant_id: options.tenantId,
        lead_id: leadId,
        event_name: "ViewContent",
        event_id: options.eventId,
        payload: {
          platform: options.platform,
          platformName: options.platformName,
          source: "email_clickthrough"
        }
      })
    ]);
  } catch {
    // Click-through should keep working even if analytics storage is temporarily unavailable.
  }
}

function renderRedirectHtml({
  targetUrl,
  platformName,
  pixelId
}: {
  targetUrl: string;
  platformName: string;
  pixelId?: string;
}) {
  const redirectScript = `setTimeout(function(){ window.location.href = ${JSON.stringify(targetUrl)}; }, 450);`;
  const pixelScript = pixelId
    ? `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=true;n.version="2.0";n.queue=[];t=b.createElement(e);t.async=true;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window, document,"script","https://connect.facebook.net/en_US/fbevents.js");
      fbq("init", "${escapeHtml(pixelId)}");
      fbq("track", "ViewContent", { content_name: "${escapeHtml(platformName)}" });
    `
    : "";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Opening ${escapeHtml(platformName)}</title>
    <script>${pixelScript}${redirectScript}</script>
  </head>
  <body style="margin:0;display:grid;min-height:100vh;place-items:center;background:#111827;color:#f9fafb;font-family:Arial,sans-serif">
    <main style="width:min(100% - 32px,480px);text-align:center">
      <p style="margin:0 0 16px;color:#fb923c;font-weight:700">HVAC Ops Pro</p>
      <h1 style="margin:0 0 12px;font-size:28px;line-height:1.2">Opening ${escapeHtml(platformName)}</h1>
      <p style="margin:0 0 20px;color:#d1d5db;line-height:1.5">Taking you to the current partner link.</p>
      <p><a style="color:#fdba74" href="${escapeHtml(targetUrl)}">Continue now</a></p>
    </main>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
