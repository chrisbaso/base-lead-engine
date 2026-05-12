import { AdminShell, EmptyState, Metric, MetricGrid } from "../admin-shell";
import { recordAdSpendAction } from "../actions";
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
        <Metric label="Email open" value={stats.status === "ready" ? percent(stats.data.emailOpenRate, 100) : "0%"} />
        <Metric label="Email click" value={stats.status === "ready" ? percent(stats.data.emailClickRate, 100) : "0%"} />
        <Metric label="Advisor handoff" value={stats.status === "ready" ? percent(stats.data.advisorHandoffRate, 100) : "0%"} />
        <Metric label="Close rate" value={stats.status === "ready" ? percent(stats.data.closeRate, 100) : "0%"} />
        <Metric label="Cost / lead" value={stats.status === "ready" ? `$${String(stats.data.costPerLead)}` : "$0"} />
        <Metric label="Cost / closed case" value={stats.status === "ready" ? `$${String(stats.data.costPerClosedCase)}` : "$0"} />
      </MetricGrid>
      <section>
        <h2>Ad Spend Input</h2>
        <form className="admin-form-row" action={recordAdSpendAction}>
          <input type="hidden" name="tenantSlug" value={tenant.identity.slug} />
          <input name="source" placeholder="Source, e.g. meta" />
          <input name="campaign" placeholder="Campaign" />
          <input name="amount" placeholder="Amount" type="number" min="0" step="0.01" />
          <button type="submit">Add spend</button>
        </form>
        {stats.status === "ready" ? <p>Total tracked spend: ${String(stats.data.totalAdSpend)}</p> : null}
      </section>
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
        <h2>Score Distribution</h2>
        {stats.status === "ready" && Object.keys(stats.data.scoreBands).length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Band</th>
                  <th>Leads</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(stats.data.scoreBands).map(([band, count]) => (
                  <tr key={band}>
                    <td>{band}</td>
                    <td>{String(count)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No score data yet" body="Score bands will appear after checkups complete." />
        )}
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
