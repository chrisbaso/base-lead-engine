import { AdminShell, EmptyState, Metric, MetricGrid } from "./admin-shell";
import { getAdminOverview } from "./data";

export default async function AdminHomePage() {
  const overview = await getAdminOverview();

  return (
    <AdminShell>
      {overview.status === "ready" ? (
        <MetricGrid>
          <Metric label="Tenants" value={String(overview.data.tenants)} />
          <Metric label="Open leads" value={String(overview.data.openLeads)} />
          <Metric label="Pending emails" value={String(overview.data.pendingEmails)} />
          <Metric label="CRM retries" value={String(overview.data.crmRetries)} />
        </MetricGrid>
      ) : (
        <EmptyState title="Connect Supabase" body={overview.reason} />
      )}
      <section>
        <h2>Operations</h2>
        <p>Tenant-scoped lead, funnel, sequence, and automation health views.</p>
      </section>
    </AdminShell>
  );
}
