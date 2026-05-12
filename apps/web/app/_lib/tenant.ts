import { headers } from "next/headers";
import { getTenantConfig, resolveTenantSlug } from "@ble/core/tenant-config";

export async function getCurrentTenant() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const slug = process.env.TENANT_SLUG ?? resolveTenantSlug(host);

  return getTenantConfig(slug);
}
