import { NextResponse } from "next/server";
import { runDueEmailSends } from "@ble/core/email-engine";
import { getSupabaseClient } from "@ble/db";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("authorization")?.replace("Bearer ", "");

  if (secret && headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDueEmailSends({
    supabase: getSupabaseClient("service"),
    resendApiKey: process.env.RESEND_API_KEY,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  });

  return NextResponse.json(result);
}
