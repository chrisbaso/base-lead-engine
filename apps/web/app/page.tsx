import { AdvisorHome } from "./_components/AdvisorPages";
import { FunnelPage } from "./_components/FunnelPage";
import { SiteLayout } from "./_components/SiteLayout";
import { getCurrentTenant } from "./_lib/tenant";

export default async function HomePage() {
  const tenant = await getCurrentTenant();

  if (!tenant.content || !tenant.compliance) {
    return <FunnelPage tenant={tenant} />;
  }

  return (
    <SiteLayout tenant={tenant}>
      <AdvisorHome tenant={tenant} />
    </SiteLayout>
  );
}
