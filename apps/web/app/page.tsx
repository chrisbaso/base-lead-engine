import { headers } from "next/headers";
import { getTenantConfig, resolveTenantSlug } from "@ble/core/tenant-config";

export default async function HomePage() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "localhost";
  const slug = process.env.TENANT_SLUG ?? resolveTenantSlug(host);
  const tenant = getTenantConfig(slug);
  const firstStep = tenant.leadCapture.steps[0];

  return (
    <main className="shell">
      <section className="hero" style={{ borderColor: tenant.branding.primaryColor }}>
        <p className="brand">{tenant.branding.logoText}</p>
        <h1>{tenant.leadCapture.headline}</h1>
        <p className="subhead">{tenant.leadCapture.subheadline}</p>
        <form className="lead-form">
          <h2>{firstStep?.title}</h2>
          {firstStep?.fields.map((field) => (
            <label key={field.id}>
              <span>{field.label}</span>
              <input
                name={field.id}
                type={field.type === "email" ? "email" : field.type === "number" ? "number" : "text"}
                required={field.required}
              />
            </label>
          ))}
          <button type="submit" style={{ background: tenant.branding.primaryColor }}>
            Start Demo Funnel
          </button>
        </form>
      </section>
    </main>
  );
}
