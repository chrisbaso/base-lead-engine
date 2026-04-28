import { listTenantConfigs } from "@ble/core/tenant-config";

export default function AdminHomePage() {
  const tenants = listTenantConfigs();

  return (
    <main className="admin-shell">
      <header>
        <h1>Lead Engine Admin</h1>
        <select aria-label="Tenant">
          {tenants.map((tenant) => (
            <option key={tenant.identity.slug}>{tenant.identity.name}</option>
          ))}
        </select>
      </header>
      <section>
        <h2>Phase 1 Foundation</h2>
        <p>The admin deployment can load tenant configs and is ready for authenticated data views.</p>
      </section>
    </main>
  );
}
