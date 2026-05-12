"use server";

import { revalidatePath } from "next/cache";
import { getTenantConfig } from "@ble/core/tenant-config";
import { getSupabaseClient } from "@ble/db";

const outcomeFields = new Set([
  "appointment_booked_at",
  "appointment_held_at",
  "case_opened_at",
  "case_closed_at"
]);

export async function assignAdvisorAction(formData: FormData) {
  const tenantSlug = readFormString(formData, "tenantSlug");
  const leadId = readFormString(formData, "leadId");
  const advisorId = readFormString(formData, "advisorId");
  const notes = readFormString(formData, "notes");

  if (!tenantSlug || !leadId || !advisorId) {
    throw new Error("Tenant, lead, and advisor are required.");
  }

  const tenant = getTenantConfig(tenantSlug);
  const supabase = getSupabaseClient("service");
  const [{ data: advisor, error: advisorError }, { data: lead, error: leadError }] = await Promise.all([
    supabase
      .from("advisors")
      .select("id, name, email, geography, current_capacity")
      .eq("tenant_id", tenant.identity.tenantId)
      .eq("id", advisorId)
      .single<{ id: string; name: string; email: string; geography: string; current_capacity: number }>(),
    supabase
      .from("leads")
      .select("id, email, phone, first_name, last_name, retirement_score, score_band, data")
      .eq("tenant_id", tenant.identity.tenantId)
      .eq("id", leadId)
      .single<{
        id: string;
        email: string | null;
        phone: string | null;
        first_name: string | null;
        last_name: string | null;
        retirement_score: number | null;
        score_band: string | null;
        data: Record<string, unknown>;
      }>()
  ]);

  if (advisorError) {
    throw new Error(`Advisor lookup failed: ${advisorError.message}`);
  }

  if (leadError) {
    throw new Error(`Lead lookup failed: ${leadError.message}`);
  }

  const { error: updateError } = await supabase
    .from("leads")
    .update({
      assigned_advisor_id: advisor.id,
      advisor_notes: notes || null,
      status: "assigned",
      updated_at: new Date().toISOString()
    })
    .eq("tenant_id", tenant.identity.tenantId)
    .eq("id", leadId);

  if (updateError) {
    throw new Error(`Lead assignment failed: ${updateError.message}`);
  }

  await supabase
    .from("advisors")
    .update({ current_capacity: advisor.current_capacity + 1, updated_at: new Date().toISOString() })
    .eq("tenant_id", tenant.identity.tenantId)
    .eq("id", advisor.id);

  const assignedAt = new Date().toISOString();
  await Promise.all([
    supabase.from("events").insert({
      tenant_id: tenant.identity.tenantId,
      lead_id: lead.id,
      event_type: "advisor.assigned",
      metadata: {
        advisorId: advisor.id,
        advisorName: advisor.name,
        notes,
        assignedAt
      }
    }),
    supabase.from("lead_events").insert({
      tenant_id: tenant.identity.tenantId,
      lead_id: lead.id,
      event_name: "AdvisorAssigned",
      event_id: crypto.randomUUID(),
      payload: {
        advisorId: advisor.id,
        notes,
        assignedAt
      }
    }),
    queueAdvisorHandoffEmail({
      tenantId: tenant.identity.tenantId,
      lead,
      advisor,
      notes,
      supabase
    }),
    lead.email
      ? queueProspectIntroEmail({
          tenantId: tenant.identity.tenantId,
          lead,
          advisor,
          supabase
        })
      : Promise.resolve()
  ]);

  revalidatePath("/leads");
  revalidatePath("/admin/dashboard");
}

export async function updateLeadOutcomeAction(formData: FormData) {
  const tenantSlug = readFormString(formData, "tenantSlug");
  const leadId = readFormString(formData, "leadId");
  const outcomeField = readFormString(formData, "outcomeField");
  const premiumAmount = readOptionalNumber(formData, "premiumAmount");
  const overrideEarned = readOptionalNumber(formData, "overrideEarned");

  if (!tenantSlug || !leadId || !outcomeField || !outcomeFields.has(outcomeField)) {
    throw new Error("A valid outcome field is required.");
  }

  const tenant = getTenantConfig(tenantSlug);
  const supabase = getSupabaseClient("service");
  const update: Record<string, string | number | null> = {
    [outcomeField]: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  if (premiumAmount !== null) {
    update.premium_amount = premiumAmount;
  }

  if (overrideEarned !== null) {
    update.override_earned = overrideEarned;
  }

  const { error } = await supabase
    .from("leads")
    .update(update)
    .eq("tenant_id", tenant.identity.tenantId)
    .eq("id", leadId);

  if (error) {
    throw new Error(`Lead outcome update failed: ${error.message}`);
  }

  await supabase.from("events").insert({
    tenant_id: tenant.identity.tenantId,
    lead_id: leadId,
    event_type: "lead.outcome_updated",
    metadata: {
      outcomeField,
      premiumAmount,
      overrideEarned
    }
  });

  revalidatePath("/leads");
  revalidatePath("/admin/funnel");
}

export async function recordAdSpendAction(formData: FormData) {
  const tenantSlug = readFormString(formData, "tenantSlug");
  const source = readFormString(formData, "source");
  const campaign = readFormString(formData, "campaign");
  const amount = readOptionalNumber(formData, "amount");

  if (!tenantSlug || !source || amount === null) {
    throw new Error("Tenant, source, and amount are required.");
  }

  const tenant = getTenantConfig(tenantSlug);
  const { error } = await getSupabaseClient("service").from("ad_spend").insert({
    tenant_id: tenant.identity.tenantId,
    source,
    campaign: campaign || null,
    amount
  });

  if (error) {
    throw new Error(`Ad spend insert failed: ${error.message}`);
  }

  revalidatePath("/funnels");
  revalidatePath("/admin/funnel");
}

async function queueAdvisorHandoffEmail({
  tenantId,
  lead,
  advisor,
  notes,
  supabase
}: {
  tenantId: string;
  lead: {
    id: string;
    email: string | null;
    phone: string | null;
    first_name: string | null;
    last_name: string | null;
    retirement_score: number | null;
    score_band: string | null;
    data: Record<string, unknown>;
  };
  advisor: { id: string; name: string; email: string; geography: string };
  notes: string;
  supabase: ReturnType<typeof getSupabaseClient>;
}) {
  const { error } = await supabase.from("email_sends").insert({
    tenant_id: tenantId,
    lead_id: lead.id,
    sequence_id: "advisor-handoff",
    step_index: 0,
    recipient_email: advisor.email,
    subject: `New RetireReadyMN lead: ${lead.first_name ?? "Prospect"} ${lead.last_name ?? ""}`.trim(),
    template: [
      `RetireReadyMN matched you with ${lead.first_name ?? "a prospect"} ${lead.last_name ?? ""}.`,
      `Score: ${String(lead.retirement_score ?? "unknown")} (${lead.score_band ?? "unknown"}).`,
      `Email: ${lead.email ?? "not provided"}. Phone: ${lead.phone ?? "not provided"}.`,
      `Geography: ${advisor.geography}.`,
      `Notes: ${notes || "No notes provided."}`,
      `Answers: ${JSON.stringify(lead.data)}`
    ].join("\n\n"),
    status: "pending",
    scheduled_for: new Date().toISOString()
  });

  if (error) {
    throw new Error(`Advisor handoff email queue failed: ${error.message}`);
  }
}

async function queueProspectIntroEmail({
  tenantId,
  lead,
  advisor,
  supabase
}: {
  tenantId: string;
  lead: { id: string; email: string | null; first_name: string | null };
  advisor: { name: string; email: string };
  supabase: ReturnType<typeof getSupabaseClient>;
}) {
  if (!lead.email) {
    return;
  }

  const { error } = await supabase.from("email_sends").insert({
    tenant_id: tenantId,
    lead_id: lead.id,
    sequence_id: "prospect-advisor-intro",
    step_index: 0,
    recipient_email: lead.email,
    subject: "We've connected you with a Minnesota retirement specialist",
    template: `Hi ${lead.first_name ?? "there"},\n\nWe've connected you with ${advisor.name}, a licensed retirement specialist in Minnesota. They'll reach out within 48 hours.\n\nThis introduction is educational and does not require you to buy or apply for any product.\n\n- RetireReadyMN`,
    status: "pending",
    scheduled_for: new Date().toISOString()
  });

  if (error) {
    throw new Error(`Prospect intro email queue failed: ${error.message}`);
  }
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalNumber(formData: FormData, key: string): number | null {
  const value = readFormString(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
