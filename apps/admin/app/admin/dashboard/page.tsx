import { AdminShell, EmptyState, Metric, MetricGrid } from "../../admin-shell";
import { getTenantDashboardStats, resolveAdminTenant } from "../../data";

type DashboardPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

function percent(value: number) {
  return `${String(value)}%`;
}

export default async function TenantDashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant);
  const stats = await getTenantDashboardStats(tenant);

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      <section>
        <h2>{tenant.identity.name} Dashboard</h2>
        <p>Tenant-level funnel, email, and affiliate performance.</p>
      </section>
      {stats.status === "ready" ? (
        <>
          <MetricGrid>
            <Metric label="Total leads" value={String(stats.data.totalLeads)} />
            <Metric label="Quiz completion" value={percent(stats.data.quizCompletionRate)} />
            <Metric label="Email open rate" value={percent(stats.data.emailOpenRate)} />
            <Metric label="Email click rate" value={percent(stats.data.emailClickRate)} />
            <Metric label="Affiliate clicks" value={String(stats.data.affiliateClicks)} />
            <Metric label="Est. conversions" value={String(stats.data.estimatedConversions)} />
          </MetricGrid>
          <section>
            <h2>Tenant Extensibility</h2>
            <p>
              These metrics read from tenant-scoped leads, email sends, and events, so the same view works
              for future trade funnels once their tenant configs are registered.
            </p>
          </section>
        </>
      ) : (
        <EmptyState title="Dashboard unavailable" body={stats.reason} />
      )}
    </AdminShell>
  );
}
