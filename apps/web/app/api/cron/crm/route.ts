import { NextResponse } from "next/server";
import { runDueCrmSync } from "@ble/core/crm-sync";
import { getSupabaseClient } from "@ble/db";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("authorization")?.replace("Bearer ", "");

  if (secret && headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runDueCrmSync({
    supabase: getSupabaseClient("service")
  });

  return NextResponse.json(result);
}
