import { AdminShell, Metric, MetricGrid } from "../admin-shell";

const demoRows = [
  { email: "lead@example.com", score: "70", status: "qualified", source: "demo" },
  { email: "partial@example.com", score: "10", status: "partial", source: "demo" }
];

export default function LeadsPage() {
  return (
    <AdminShell>
      <MetricGrid>
        <Metric label="Qualified" value="1" />
        <Metric label="Partials" value="1" />
        <Metric label="Avg score" value="40" />
      </MetricGrid>
      <section>
        <h2>Leads</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Status</th>
                <th>Score</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {demoRows.map((row) => (
                <tr key={row.email}>
                  <td>{row.email}</td>
                  <td>{row.status}</td>
                  <td>{row.score}</td>
                  <td>{row.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
