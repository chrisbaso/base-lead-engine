import { AdminShell } from "../admin-shell";
import { resolveAdminTenant } from "../data";

type ConfigPageProps = {
  searchParams: Promise<{ tenant?: string }>;
};

export default async function ConfigPage({ searchParams }: ConfigPageProps) {
  const params = await searchParams;
  const tenant = resolveAdminTenant(params.tenant);

  return (
    <AdminShell selectedTenantSlug={tenant.identity.slug}>
      <section>
        <h2>Tenant Config</h2>
        <pre>{JSON.stringify(tenant, null, 2)}</pre>
      </section>
    </AdminShell>
  );
}
