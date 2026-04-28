import { NextResponse } from "next/server";
import { z } from "zod";
import { handleResendWebhook } from "@ble/core/email-engine";
import { getSupabaseClient } from "@ble/db";

const resendWebhookSchema = z.object({
  type: z.string().min(1),
  data: z.object({
    email_id: z.string().min(1),
    to: z.array(z.string().email()).min(1)
  })
});

export async function POST(request: Request) {
  const payload = resendWebhookSchema.parse(await request.json());
  const tenantSlug = new URL(request.url).searchParams.get("tenant") ?? process.env.TENANT_SLUG ?? "demo";
  const firstRecipient = payload.data.to[0];

  if (!firstRecipient) {
    return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
  }

  await handleResendWebhook({
    supabase: getSupabaseClient("service"),
    tenantSlug,
    eventType: payload.type,
    messageId: payload.data.email_id,
    recipientEmail: firstRecipient
  });

  return NextResponse.json({ ok: true });
}
