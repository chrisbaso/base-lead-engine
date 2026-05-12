import { AdvisorHome } from "./_components/AdvisorPages";
import { FunnelPage } from "./_components/FunnelPage";
import { RetireReadyMnHome } from "./_components/RetireReadyMnPages";
import { SiteLayout } from "./_components/SiteLayout";
import { getCurrentTenant } from "./_lib/tenant";

type HomePageProps = {
  searchParams: Promise<{ hero_variant?: string; quiz_frame?: string }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const tenant = await getCurrentTenant();

  if (tenant.identity.slug === "retire-ready-mn") {
    const params = await searchParams;
    return (
      <RetireReadyMnHome
        tenant={tenant}
        heroVariantId={params.hero_variant}
        quizFrameId={params.quiz_frame}
      />
    );
  }

  if (!tenant.content || !tenant.compliance) {
    return <FunnelPage tenant={tenant} />;
  }

  return (
    <SiteLayout tenant={tenant}>
      <AdvisorHome tenant={tenant} />
    </SiteLayout>
  );
}
