import { AdminShell, EmptyState, Metric, MetricGrid } from "../admin-shell";
import { getEmailSendStats, resolveAdminTenant } from "../data";

type SequencesPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

function rate(numerator: number, denominator: number) {
  if (denominator === 0) {
    return "0%";
  }

  return `${String(Math.round((numerator / denominator) * 100))}%`;
}

export default async function SequencesPage({ searchParams }: SequencesPageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant);
  const stats = await getEmailSendStats(tenant);
  const data = stats.status === "ready" ? stats.data : undefined;

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      <MetricGrid>
        <Metric label="Emails" value={String(tenant.email.sequences.length)} />
        <Metric label="Open rate" value={data ? rate(data.opened, data.sent) : "0%"} />
        <Metric label="Click rate" value={data ? rate(data.clicked, data.sent) : "0%"} />
        <Metric label="Suppressed" value={String(data?.suppressed ?? 0)} />
      </MetricGrid>
      <section>
        <h2>Email Sequence</h2>
        {tenant.email.sequences.length === 0 ? (
          <EmptyState title="No sequence configured" body="This tenant does not have email sequence steps yet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Delay</th>
                  <th>Subject</th>
                  <th>Condition</th>
                </tr>
              </thead>
              <tbody>
                {tenant.email.sequences.map((sequence) => (
                  <tr key={sequence.id}>
                    <td>{String(sequence.delayHours)}h</td>
                    <td>{sequence.subject}</td>
                    <td>{sequence.condition}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section>
        <h2>Delivery Health</h2>
        {stats.status === "unavailable" ? (
          <EmptyState title="Email stats unavailable" body={stats.reason} />
        ) : (
          <MetricGrid>
            <Metric label="Queued" value={String(stats.data.pending)} />
            <Metric label="Sent" value={String(stats.data.sent)} />
            <Metric label="Opened" value={String(stats.data.opened)} />
            <Metric label="Clicked" value={String(stats.data.clicked)} />
          </MetricGrid>
        )}
      </section>
    </AdminShell>
  );
}
