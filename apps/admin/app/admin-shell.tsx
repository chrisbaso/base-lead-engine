import Link from "next/link";
import { listTenantConfigs } from "@ble/core/tenant-config";

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/leads", label: "Leads" },
  { href: "/funnels", label: "Funnels" },
  { href: "/sequences", label: "Sequences" },
  { href: "/config", label: "Config" }
];

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const tenants = listTenantConfigs();

  return (
    <main className="admin-shell">
      <header>
        <div>
          <p className="eyebrow">Base Lead Engine</p>
          <h1>Operations</h1>
        </div>
        <select aria-label="Tenant">
          {tenants.map((tenant) => (
            <option key={tenant.identity.slug}>{tenant.identity.name}</option>
          ))}
        </select>
      </header>
      <nav className="admin-nav" aria-label="Admin">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </main>
  );
}

export function MetricGrid({ children }: Readonly<{ children: React.ReactNode }>) {
  return <section className="metric-grid">{children}</section>;
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
