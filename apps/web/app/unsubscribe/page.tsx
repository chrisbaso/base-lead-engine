import { suppressEmail } from "@ble/core/email-engine";
import { getSupabaseClient } from "@ble/db";

type UnsubscribePageProps = {
  searchParams: Promise<{
    tenant_id?: string;
    email?: string;
  }>;
};

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const params = await searchParams;

  if (params.tenant_id && params.email) {
    await suppressEmail({
      supabase: getSupabaseClient("service"),
      tenantId: params.tenant_id,
      email: params.email,
      reason: "unsubscribe",
      source: "unsubscribe-page"
    });
  }

  return (
    <main className="shell">
      <section className="hero">
        <p className="brand">Email preferences</p>
        <h1>You are unsubscribed</h1>
        <p className="subhead">This email address has been added to the suppression list.</p>
      </section>
    </main>
  );
}
