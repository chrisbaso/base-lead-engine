import { AdminShell, EmptyState, Metric, MetricGrid } from "../../admin-shell";
import type { VariantPerformanceRow } from "../../data";
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
            <h2>Variant Performance</h2>
            <VariantTable title="Quiz Copy" rows={stats.data.variantPerformance.quizVariants} />
            <VariantTable title="First Email" rows={stats.data.variantPerformance.emailVariants} />
          </section>
          <section>
            <h2>Optimization Goal</h2>
            <p>
              Primary goal: qualified affiliate clicks per 100 quiz visitors. Secondary goal: estimated
              affiliate conversions per variant, so losing copy gets cut and winning copy gets more budget.
            </p>
          </section>
        </>
      ) : (
        <EmptyState title="Dashboard unavailable" body={stats.reason} />
      )}
    </AdminShell>
  );
}

function VariantTable({ title, rows }: { title: string; rows: VariantPerformanceRow[] }) {
  return (
    <div className="table-wrap">
      <h3>{title}</h3>
      {rows.length === 0 ? (
        <p>No variant data yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Variant</th>
              <th>Leads</th>
              <th>Partials</th>
              <th>Sends</th>
              <th>Open</th>
              <th>Click</th>
              <th>Affiliate clicks</th>
              <th>Est. conv.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.variantId}>
                <td>{row.variantId}</td>
                <td>{String(row.leads)}</td>
                <td>{String(row.partials)}</td>
                <td>{String(row.sends)}</td>
                <td>{percent(row.openRate)}</td>
                <td>{percent(row.clickRate)}</td>
                <td>{String(row.affiliateClicks)}</td>
                <td>{String(row.estimatedConversions)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
