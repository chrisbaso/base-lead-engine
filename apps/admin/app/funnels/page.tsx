import { getTenantConfig } from "@ble/core/tenant-config";
import { AdminShell, Metric, MetricGrid } from "../admin-shell";

export default function FunnelsPage() {
  const tenant = getTenantConfig("demo");

  return (
    <AdminShell>
      <MetricGrid>
        <Metric label="Steps" value={String(tenant.leadCapture.steps.length)} />
        <Metric label="Completion" value="0%" />
        <Metric label="Drop-off" value="0%" />
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
              </div>
            </article>
          ))}
        </div>
      </section>
    </AdminShell>
  );
}
