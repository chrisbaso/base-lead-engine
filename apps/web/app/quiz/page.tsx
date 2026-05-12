import { resolveHvacExperimentAssignment } from "@ble/tenant-hvac-ops-pro/experiments";
import { FunnelPage } from "../_components/FunnelPage";
import { getCurrentTenant } from "../_lib/tenant";

type QuizRouteProps = {
  searchParams: Promise<{ quiz_variant?: string; email_variant?: string }>;
};

export default async function QuizRoute({ searchParams }: QuizRouteProps) {
  const params = await searchParams;
  const tenant = await getCurrentTenant();
  const assignment =
    tenant.identity.slug === "hvac-ops-pro"
      ? resolveHvacExperimentAssignment({
          quizVariant: params.quiz_variant,
          emailVariant: params.email_variant
        })
      : undefined;

  return (
    <FunnelPage
      tenant={tenant}
      {...(assignment?.quizVariant ? { quizVariant: assignment.quizVariant } : {})}
      {...(assignment?.emailVariant ? { emailVariant: assignment.emailVariant } : {})}
    />
  );
}
