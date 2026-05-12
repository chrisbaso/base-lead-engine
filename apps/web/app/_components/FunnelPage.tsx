import type { CSSProperties } from "react";
import type { TenantConfig } from "@ble/tenant-schema";
import { getHvacQuizVariation } from "@ble/tenant-hvac-ops-pro/experiments";
import { LeadCaptureClient } from "../lead-capture-client";
import { TrackingScripts } from "../tracking-scripts";

type FunnelPageProps = {
  tenant: TenantConfig;
  quizVariant?: string;
  emailVariant?: string;
};

export function FunnelPage({ tenant, quizVariant, emailVariant }: FunnelPageProps) {
  const quizCopy =
    tenant.identity.slug === "hvac-ops-pro" ? getHvacQuizVariation(quizVariant) : undefined;
  const headline = quizCopy?.headline ?? tenant.leadCapture.headline;
  const subheadline = quizCopy?.subheadline ?? tenant.leadCapture.subheadline;

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
        <h1>{headline}</h1>
        <p className="subhead">{subheadline}</p>
        <LeadCaptureClient
          tenant={tenant}
          {...(quizVariant ? { initialQuizVariant: quizVariant } : {})}
          {...(emailVariant ? { initialEmailVariant: emailVariant } : {})}
        />
      </section>
    </main>
  );
}
