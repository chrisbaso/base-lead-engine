import { suppressEmail, verifyUnsubscribeToken } from "@ble/core/email-engine";
import { getSupabaseClient } from "@ble/db";

type UnsubscribePageProps = {
  searchParams: Promise<{
    tenant_id?: string;
    email?: string;
    token?: string;
  }>;
};

export default async function UnsubscribePage({ searchParams }: UnsubscribePageProps) {
  const params = await searchParams;

  const tokenIsValid =
    params.tenant_id && params.email
      ? verifyUnsubscribeToken(params.tenant_id, params.email, params.token)
      : false;

  if (params.tenant_id && params.email && tokenIsValid) {
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
        <h1>{tokenIsValid ? "You are unsubscribed" : "Unsubscribe link expired"}</h1>
        <p className="subhead">
          {tokenIsValid
            ? "This email address has been added to the suppression list."
            : "Please use the unsubscribe link from the most recent email."}
        </p>
      </section>
    </main>
  );
}
