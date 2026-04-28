import { getTenantConfig } from "@ble/core/tenant-config";
import { AdminShell } from "../admin-shell";

export default function ConfigPage() {
  const tenant = getTenantConfig("demo");

  return (
    <AdminShell>
      <section>
        <h2>Tenant Config</h2>
        <pre>{JSON.stringify(tenant, null, 2)}</pre>
      </section>
    </AdminShell>
  );
}
