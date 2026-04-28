import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { resolveTenantSlug } from "@ble/core/tenant-config";

export function middleware(request: NextRequest) {
  const slug = resolveTenantSlug(request.nextUrl.hostname);
  const response = NextResponse.next();
  response.headers.set("x-tenant-slug", slug);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
