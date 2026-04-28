import { headers } from "next/headers";
import { getTenantConfig, resolveTenantSlug } from "@ble/core/tenant-config";
import { LeadCaptureClient } from "./lead-capture-client";
import { TrackingScripts } from "./tracking-scripts";

export default async function HomePage() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const slug = process.env.TENANT_SLUG ?? resolveTenantSlug(host);
  const tenant = getTenantConfig(slug);

  return (
    <main className="shell">
      <TrackingScripts tenant={tenant} />
      <section className="hero" style={{ borderColor: tenant.branding.primaryColor }}>
        <p className="brand">{tenant.branding.logoText}</p>
        <h1>{tenant.leadCapture.headline}</h1>
        <p className="subhead">{tenant.leadCapture.subheadline}</p>
        <LeadCaptureClient tenant={tenant} />
      </section>
    </main>
  );
}
