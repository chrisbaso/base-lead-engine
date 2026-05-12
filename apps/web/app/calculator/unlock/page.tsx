import { CalculatorFlow } from "../CalculatorFlow";
import { SiteLayout } from "../../_components/SiteLayout";
import { getCurrentTenant } from "../../_lib/tenant";

export default async function CalculatorUnlockPage() {
  const tenant = await getCurrentTenant();

  return (
    <SiteLayout tenant={tenant}>
      <CalculatorFlow tenant={tenant} mode="unlock" />
    </SiteLayout>
  );
}
