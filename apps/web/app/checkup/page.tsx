import { redirect } from "next/navigation";
import { RetireReadyMnCheckup } from "../_components/RetireReadyMnPages";
import { getCurrentTenant } from "../_lib/tenant";

type CheckupPageProps = {
  searchParams: Promise<{ hero_variant?: string; quiz_frame?: string }>;
};

export default async function CheckupPage({ searchParams }: CheckupPageProps) {
  const tenant = await getCurrentTenant();

  if (tenant.identity.slug !== "retire-ready-mn") {
    redirect("/calculator");
  }

  const params = await searchParams;

  return (
    <RetireReadyMnCheckup
      tenant={tenant}
      heroVariantId={params.hero_variant}
      quizFrameId={params.quiz_frame}
    />
  );
}
