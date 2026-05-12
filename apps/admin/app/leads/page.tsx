import { AdminShell, EmptyState, Metric, MetricGrid } from "../admin-shell";
import { assignAdvisorAction, updateLeadOutcomeAction } from "../actions";
import { getAdvisors, getLeadRows, getLeadTimeline, resolveAdminTenant } from "../data";

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
  const [leads, timeline, advisors] = await Promise.all([
    getLeadRows(tenant),
    getLeadTimeline(tenant),
    getAdvisors(tenant)
  ]);
  const rows = leads.status === "ready" ? leads.data : [];
  const advisorRows = advisors.status === "ready" ? advisors.data : [];
  const advisorNames = new Map(advisorRows.map((advisor) => [advisor.id, advisor.name]));
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
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Band</th>
                  <th>Source</th>
                  <th>Advisor</th>
                  <th>Outcomes</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>{[row.first_name, row.last_name].filter(Boolean).join(" ") || "unknown"}</td>
                    <td>{row.email ?? "unknown"}</td>
                    <td>{row.phone ?? "none"}</td>
                    <td>{row.status}</td>
                    <td>{String(row.retirement_score ?? row.score)}</td>
                    <td>{row.score_band ?? "n/a"}</td>
                    <td>{sourceLabel(row.source)}</td>
                    <td>
                      <form className="inline-admin-form" action={assignAdvisorAction}>
                        <input type="hidden" name="tenantSlug" value={tenant.identity.slug} />
                        <input type="hidden" name="leadId" value={row.id} />
                        <select name="advisorId" defaultValue={row.assigned_advisor_id ?? ""} aria-label="Advisor">
                          <option value="">Unassigned</option>
                          {advisorRows.map((advisor) => (
                            <option key={advisor.id} value={advisor.id}>
                              {advisor.name} ({advisor.geography})
                            </option>
                          ))}
                        </select>
                        <input
                          name="notes"
                          placeholder="Assignment notes"
                          defaultValue={row.advisor_notes ?? ""}
                          aria-label="Assignment notes"
                        />
                        <button type="submit">Assign</button>
                      </form>
                      {row.assigned_advisor_id ? (
                        <small>Assigned to {advisorNames.get(row.assigned_advisor_id) ?? row.assigned_advisor_id}</small>
                      ) : null}
                    </td>
                    <td>
                      <div className="outcome-stack">
                        {[
                          ["appointment_booked_at", "Booked", row.appointment_booked_at],
                          ["appointment_held_at", "Held", row.appointment_held_at],
                          ["case_opened_at", "Opened", row.case_opened_at],
                          ["case_closed_at", "Closed", row.case_closed_at]
                        ].map(([field, label, value]) => (
                          <form key={field} action={updateLeadOutcomeAction}>
                            <input type="hidden" name="tenantSlug" value={tenant.identity.slug} />
                            <input type="hidden" name="leadId" value={row.id} />
                            <input type="hidden" name="outcomeField" value={field ?? ""} />
                            {field === "case_closed_at" ? (
                              <>
                                <input name="premiumAmount" placeholder="Premium" defaultValue={row.premium_amount ?? ""} />
                                <input name="overrideEarned" placeholder="Override" defaultValue={row.override_earned ?? ""} />
                              </>
                            ) : null}
                            <button type="submit">{value ? `${label} done` : label}</button>
                          </form>
                        ))}
                      </div>
                    </td>
                    <td>{new Date(row.updated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {advisors.status === "unavailable" ? (
        <section>
          <EmptyState title="Advisor data unavailable" body={advisors.reason} />
        </section>
      ) : advisorRows.length === 0 ? (
        <section>
          <EmptyState title="No advisors configured" body="Add advisors in Supabase to enable manual matching." />
        </section>
      ) : null}
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
