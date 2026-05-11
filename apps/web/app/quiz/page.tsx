import { FunnelPage } from "../_components/FunnelPage";
import { getCurrentTenant } from "../_lib/tenant";

export default async function QuizRoute() {
  const tenant = await getCurrentTenant();

  return <FunnelPage tenant={tenant} />;
}
