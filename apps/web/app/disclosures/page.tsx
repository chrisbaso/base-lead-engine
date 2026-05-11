import { AdvisorDisclosures } from "../_components/AdvisorPages";
import { SiteLayout } from "../_components/SiteLayout";
import { getCurrentTenant } from "../_lib/tenant";

export default async function DisclosuresPage() {
  const tenant = await getCurrentTenant();

  return (
    <SiteLayout tenant={tenant}>
      <AdvisorDisclosures tenant={tenant} />
    </SiteLayout>
  );
}
