import { AdvisorAbout } from "../_components/AdvisorPages";
import { SiteLayout } from "../_components/SiteLayout";
import { getCurrentTenant } from "../_lib/tenant";

export default async function AboutPage() {
  const tenant = await getCurrentTenant();

  return (
    <SiteLayout tenant={tenant}>
      <AdvisorAbout tenant={tenant} />
    </SiteLayout>
  );
}
