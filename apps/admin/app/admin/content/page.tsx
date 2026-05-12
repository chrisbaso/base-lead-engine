import Link from "next/link";
import { AdminShell, EmptyState, Metric, MetricGrid } from "../../admin-shell";
import { getContentOpsOverview, resolveAdminTenant } from "../../data";

type ContentPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant ?? "retire-ready-mn");
  const overview = await getContentOpsOverview(tenant);

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      {overview.status === "ready" ? (
        <MetricGrid>
          <Metric label="Ideas" value={String(overview.data.ideas)} />
          <Metric label="Drafts" value={String(overview.data.drafts)} />
          <Metric label="Pending reviews" value={String(overview.data.pendingReviews)} />
          <Metric label="Published" value={String(overview.data.published)} />
          <Metric label="Open flags" value={String(overview.data.unresolvedFlags)} />
        </MetricGrid>
      ) : (
        <EmptyState title="Content ops unavailable" body={overview.reason} />
      )}

      <section>
        <h2>RetireReadyMN Content Operations</h2>
        <p>Internal workflow for AI-assisted ideas, drafts, compliance reviews, publication tracking, and article funnel performance.</p>
        <div className="admin-link-grid">
          <Link href="/admin/content/ideas">Ideas</Link>
          <Link href="/admin/content/review">Review checklist</Link>
          <Link href="/admin/content/performance">Performance</Link>
        </div>
      </section>

      <section>
        <h2>Recent Agent Runs</h2>
        {overview.status === "ready" && overview.data.recentAgentRuns.length > 0 ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Agent</th>
                  <th>Run type</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {overview.data.recentAgentRuns.map((run) => (
                  <tr key={run.id}>
                    <td>{run.agent_name}</td>
                    <td>{run.run_type}</td>
                    <td>{run.status}</td>
                    <td>{run.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No agent runs yet" body="AI content generation and refresh jobs will appear here after they run." />
        )}
      </section>
    </AdminShell>
  );
}
