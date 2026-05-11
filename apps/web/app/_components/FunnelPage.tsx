import type { CSSProperties } from "react";
import type { TenantConfig } from "@ble/tenant-schema";
import { LeadCaptureClient } from "../lead-capture-client";
import { TrackingScripts } from "../tracking-scripts";

type FunnelPageProps = {
  tenant: TenantConfig;
};

export function FunnelPage({ tenant }: FunnelPageProps) {
  return (
    <main
      className="shell"
      style={
        {
          "--color-brand": tenant.branding.primaryColor,
          "--color-accent": tenant.branding.accentColor
        } as CSSProperties
      }
    >
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
