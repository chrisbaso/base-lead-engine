import { NextResponse } from "next/server";
import { runRetireReadyLeadAgentsAction } from "../../../actions";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const headerSecret = request.headers.get("authorization")?.replace("Bearer ", "");

  if (secret && headerSecret !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = new FormData();
  formData.set("tenantSlug", "retire-ready-mn");
  await runRetireReadyLeadAgentsAction(formData);

  return NextResponse.json({ ok: true, tenantSlug: "retire-ready-mn" });
}
