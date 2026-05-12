import { AdminShell, EmptyState, Metric, MetricGrid } from "../../admin-shell";
import { runRetireReadyLeadAgentsAction } from "../../actions";
import { getAdvisors, getLeadAgentOps, resolveAdminTenant } from "../../data";

type AgentsPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function AgentsPage({ searchParams }: AgentsPageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant ?? "retire-ready-mn");
  const [ops, advisors] = await Promise.all([getLeadAgentOps(tenant), getAdvisors(tenant)]);
  const advisorNames = new Map(
    advisors.status === "ready" ? advisors.data.map((advisor) => [advisor.id, advisor.name]) : []
  );

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      <section>
        <h2>RetireReadyMN Lead Agents</h2>
        <p>
          Internal automation for guaranteed-income intent scoring, education routing, compliance guardrails,
          and advisor handoff recommendations.
        </p>
        <form className="admin-form-row agent-run-form" action={runRetireReadyLeadAgentsAction}>
          <input type="hidden" name="tenantSlug" value={tenant.identity.slug} />
          <button type="submit">Run Lead Agents</button>
        </form>
      </section>

      {ops.status === "ready" ? (
        <>
          <MetricGrid>
            <Metric label="High intent" value={String(ops.data.stats.highIntent)} />
            <Metric label="Medium intent" value={String(ops.data.stats.mediumIntent)} />
            <Metric label="Hot priority" value={String(ops.data.stats.hotPriority)} />
            <Metric label="Priority reviews" value={String(ops.data.stats.priorityReviews)} />
            <Metric label="Intel coverage" value={`${String(ops.data.intelligenceCoverage)}%`} />
            <Metric label="Pending routes" value={String(ops.data.pendingRecommendations)} />
          </MetricGrid>

          <section>
            <h2>Agent Queue</h2>
            {ops.data.queue.length === 0 ? (
              <EmptyState title="No leads to analyze" body="Submitted leads will appear here after the funnel captures them." />
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Intent</th>
                      <th>Action</th>
                      <th>Nurture</th>
                      <th>Agent notes</th>
                      <th>Route</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ops.data.queue.map(({ lead, intelligence, recommendation }) => (
                      <tr key={lead.id}>
                        <td>
                          <strong>{[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "unknown"}</strong>
                          <span>{lead.email ?? "no email"}</span>
                        </td>
                        <td>
                          <strong>{String(lead.annuity_intent_score ?? intelligence?.intent_score ?? 0)}</strong>
                          <span>{lead.annuity_intent_band ?? intelligence?.intent_band ?? "unscored"}</span>
                        </td>
                        <td>
                          <strong>{lead.automation_priority ?? intelligence?.automation_priority ?? "standard"}</strong>
                          <span>{lead.recommended_action ?? intelligence?.recommended_next_action ?? "continue_nurture"}</span>
                        </td>
                        <td>{lead.next_best_email_id ?? intelligence?.next_best_email_id ?? "four-percent-rule"}</td>
                        <td>
                          <strong>{intelligence?.summary ?? "Run agents to generate internal guidance."}</strong>
                          <span>{formatList(intelligence?.advisor_talking_points)}</span>
                        </td>
                        <td>
                          {recommendation ? (
                            <>
                              <strong>{advisorNames.get(recommendation.advisor_id) ?? recommendation.advisor_id}</strong>
                              <span>{recommendation.rationale}</span>
                            </>
                          ) : (
                            "No pending recommendation"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2>Recent Agent Runs</h2>
            {ops.data.recentAgentRuns.length > 0 ? (
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
                    {ops.data.recentAgentRuns.map((run) => (
                      <tr key={run.id}>
                        <td>{run.agent_name}</td>
                        <td>{run.run_type}</td>
                        <td>{run.status}</td>
                        <td>{new Date(run.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="No runs yet" body="Run the lead agents to create qualification, nurture, routing, and compliance records." />
            )}
          </section>
        </>
      ) : (
        <EmptyState title="Lead agent data unavailable" body={ops.reason} />
      )}
    </AdminShell>
  );
}

function formatList(values: string[] | undefined): string {
  if (!values || values.length === 0) {
    return "No talking points yet.";
  }

  return values.slice(0, 3).join(" | ");
}
