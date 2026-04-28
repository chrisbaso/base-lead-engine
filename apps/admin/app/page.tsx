import { AdminShell, Metric, MetricGrid } from "./admin-shell";

export default function AdminHomePage() {
  return (
    <AdminShell>
      <MetricGrid>
        <Metric label="Tenants" value="1" />
        <Metric label="Open leads" value="0" />
        <Metric label="Pending emails" value="0" />
        <Metric label="CRM retries" value="0" />
      </MetricGrid>
      <section>
        <h2>Phase 1 Foundation</h2>
        <p>The admin dashboard shell is ready for tenant-scoped operational views.</p>
      </section>
    </AdminShell>
  );
}
