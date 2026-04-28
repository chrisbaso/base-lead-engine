import { AdminShell, EmptyState, Metric, MetricGrid } from "../admin-shell";
import { getLeadRows, getLeadTimeline, resolveAdminTenant } from "../data";

type LeadsPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

function sourceLabel(source: Record<string, unknown>) {
  const utmSource = typeof source.utmSource === "string" ? source.utmSource : undefined;
  const url = typeof source.url === "string" ? source.url : undefined;
  return utmSource ?? url ?? "direct";
}

function averageScore(scores: number[]) {
  if (scores.length === 0) {
    return "0";
  }

  return String(Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length));
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant);
  const [leads, timeline] = await Promise.all([getLeadRows(tenant), getLeadTimeline(tenant)]);
  const rows = leads.status === "ready" ? leads.data : [];
  const qualified = rows.filter((row) => row.score >= tenant.scoring.qualifiedThreshold).length;
  const partials = rows.filter((row) => row.status === "partial").length;

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      <MetricGrid>
        <Metric label="Qualified" value={String(qualified)} />
        <Metric label="Partials" value={String(partials)} />
        <Metric label="Avg score" value={averageScore(rows.map((row) => row.score))} />
      </MetricGrid>
      <section>
        <h2>Leads</h2>
        {leads.status === "unavailable" ? (
          <EmptyState title="Lead data unavailable" body={leads.reason} />
        ) : rows.length === 0 ? (
          <EmptyState title="No leads yet" body="Submitted leads will appear here after Supabase is connected." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Source</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{row.email ?? "unknown"}</td>
                    <td>{row.phone ?? "none"}</td>
                    <td>{row.status}</td>
                    <td>{String(row.score)}</td>
                    <td>{sourceLabel(row.source)}</td>
                    <td>{new Date(row.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2>Timeline</h2>
        {timeline.status === "unavailable" ? (
          <EmptyState title="Timeline unavailable" body={timeline.reason} />
        ) : timeline.data.length === 0 ? (
          <EmptyState title="No events yet" body="Lead events will appear as visitors move through funnels." />
        ) : (
          <div className="timeline">
            {timeline.data.map((event) => (
              <article key={event.id}>
                <strong>{event.event_name}</strong>
                <span>{new Date(event.created_at).toLocaleString()}</span>
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}
