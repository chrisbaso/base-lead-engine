import { CalculatorFlow } from "../CalculatorFlow";
import { SiteLayout } from "../../_components/SiteLayout";
import { getCurrentTenant } from "../../_lib/tenant";

export default async function CalculatorResultPage() {
  const tenant = await getCurrentTenant();

  return (
    <SiteLayout tenant={tenant}>
      <CalculatorFlow tenant={tenant} mode="result" />
    </SiteLayout>
  );
}
