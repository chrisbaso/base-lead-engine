import { AdminShell, EmptyState, Metric, MetricGrid } from "../admin-shell";
import { getFunnelStats, resolveAdminTenant } from "../data";

type FunnelsPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

function percent(value: number, total: number) {
  if (total === 0) {
    return "0%";
  }

  return `${String(Math.round((value / total) * 100))}%`;
}

export default async function FunnelsPage({ searchParams }: FunnelsPageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant);
  const stats = await getFunnelStats(tenant);
  const completed = stats.status === "ready" ? stats.data.completedLeads : 0;
  const totalEvents = stats.status === "ready" ? stats.data.totalEvents : 0;

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      <MetricGrid>
        <Metric label="Steps" value={String(tenant.leadCapture.steps.length)} />
        <Metric label="Completion" value={percent(completed, totalEvents)} />
        <Metric label="Events" value={String(totalEvents)} />
      </MetricGrid>
      <section>
        <h2>Funnel Steps</h2>
        <div className="step-list">
          {tenant.leadCapture.steps.map((step, index) => (
            <article key={step.id} className="step-row">
              <span>{String(index + 1)}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.fields.map((field) => field.label).join(", ")}</p>
                {stats.status === "ready" ? (
                  <p>{String(stats.data.stepCounts[step.id] ?? 0)} events</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>
      <section>
        <h2>Source Attribution</h2>
        {stats.status === "unavailable" ? (
          <EmptyState title="Attribution unavailable" body={stats.reason} />
        ) : Object.keys(stats.data.sources).length === 0 ? (
          <EmptyState title="No source data yet" body="UTM source counts will appear after leads submit." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Events</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.data.sources).map(([source, count]) => (
                  <tr key={source}>
                    <td>{source}</td>
                    <td>{String(count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
