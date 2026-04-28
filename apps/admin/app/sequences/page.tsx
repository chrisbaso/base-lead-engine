import { getTenantConfig } from "@ble/core/tenant-config";
import { AdminShell, Metric, MetricGrid } from "../admin-shell";

export default function SequencesPage() {
  const tenant = getTenantConfig("demo");

  return (
    <AdminShell>
      <MetricGrid>
        <Metric label="Emails" value={String(tenant.email.sequences.length)} />
        <Metric label="Open rate" value="0%" />
        <Metric label="Click rate" value="0%" />
        <Metric label="Suppressed" value="0" />
      </MetricGrid>
      <section>
        <h2>Email Sequence</h2>
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
      </section>
    </AdminShell>
  );
}
