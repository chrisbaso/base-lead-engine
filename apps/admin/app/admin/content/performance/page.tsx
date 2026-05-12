import { AdminShell, EmptyState, Metric, MetricGrid } from "../../../admin-shell";
import { getContentPerformance, resolveAdminTenant } from "../../../data";

type PerformancePageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function ContentPerformancePage({ searchParams }: PerformancePageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant ?? "retire-ready-mn");
  const performance = await getContentPerformance(tenant);
  const rows = performance.status === "ready" ? performance.data : [];
  const totals = rows.reduce(
    (sum, row) => ({
      views: sum.views + row.views,
      ctaClicks: sum.ctaClicks + row.ctaClicks,
      leadCaptures: sum.leadCaptures + row.leadCaptures,
      advisorAssignments: sum.advisorAssignments + row.advisorAssignments
    }),
    { views: 0, ctaClicks: 0, leadCaptures: 0, advisorAssignments: 0 }
  );

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      <MetricGrid>
        <Metric label="Article views" value={String(totals.views)} />
        <Metric label="CTA clicks" value={String(totals.ctaClicks)} />
        <Metric label="Article leads" value={String(totals.leadCaptures)} />
        <Metric label="Advisor handoffs" value={String(totals.advisorAssignments)} />
      </MetricGrid>

      <section>
        <h2>Article Funnel Performance</h2>
        {performance.status === "unavailable" ? (
          <EmptyState title="Performance unavailable" body={performance.reason} />
        ) : rows.length === 0 ? (
          <EmptyState title="No article events yet" body="Article views, CTA clicks, quiz starts, and captures will appear after traffic arrives." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Article</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>CTA</th>
                  <th>Quiz starts</th>
                  <th>Email captures</th>
                  <th>Phone captures</th>
                  <th>Advisor handoffs</th>
                  <th>Lead rate</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.slug}>
                    <td>
                      <strong>{row.title}</strong>
                      <br />
                      <span>{row.category}</span>
                    </td>
                    <td>{row.status}</td>
                    <td>{String(row.views)}</td>
                    <td>{String(row.ctaClicks)}</td>
                    <td>{String(row.quizStarts)}</td>
                    <td>{String(row.leadCaptures)}</td>
                    <td>{String(row.phoneCaptures)}</td>
                    <td>{String(row.advisorAssignments)}</td>
                    <td>{String(row.leadCaptureRate)}%</td>
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
