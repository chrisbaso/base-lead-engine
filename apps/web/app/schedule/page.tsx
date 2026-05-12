import { AdvisorSchedule } from "../_components/AdvisorPages";
import { SiteLayout } from "../_components/SiteLayout";
import { getCurrentTenant } from "../_lib/tenant";

export default async function SchedulePage() {
  const tenant = await getCurrentTenant();

  return (
    <SiteLayout tenant={tenant}>
      <AdvisorSchedule tenant={tenant} />
    </SiteLayout>
  );
}
