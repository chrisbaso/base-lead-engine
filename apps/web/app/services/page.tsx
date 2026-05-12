import { AdvisorServices } from "../_components/AdvisorPages";
import { SiteLayout } from "../_components/SiteLayout";
import { getCurrentTenant } from "../_lib/tenant";

export default async function ServicesPage() {
  const tenant = await getCurrentTenant();

  return (
    <SiteLayout tenant={tenant}>
      <AdvisorServices tenant={tenant} />
    </SiteLayout>
  );
}
