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

const complianceChecklist = [
  ["no_guarantees", "No guarantees"],
  ["no_product_recommendation", "No product recommendation"],
  ["no_advisor_identity", "No advisor identity"],
  ["disclosure_present", "Disclosure present"],
  ["sources_present", "Sources present"],
  ["cta_educational", "CTA educational"]
] as const;

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
      .select("id, email, phone, first_name, last_name, retirement_score, score_band, source, data")
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
        source: Record<string, unknown>;
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

  const articleSlug = readRecordString(lead.source, "articleSlug");
  if (articleSlug) {
    await recordContentPerformanceEvent({
      supabase,
      tenantId: tenant.identity.tenantId,
      leadId: lead.id,
      eventType: "advisor_assigned_from_article",
      articleSlug,
      articleCategory: readRecordString(lead.source, "articleCategory"),
      ctaVariant: readRecordString(lead.source, "ctaVariant")
    });
  }

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

export async function createContentIdeaAction(formData: FormData) {
  const tenantSlug = readFormString(formData, "tenantSlug");
  const topic = readFormString(formData, "topic");
  const category = readFormString(formData, "category");
  const priority = readFormString(formData, "priority") || "medium";
  const targetKeyword = readFormString(formData, "targetKeyword");
  const notes = readFormString(formData, "notes");

  if (!tenantSlug || !topic || !category) {
    throw new Error("Tenant, topic, and category are required.");
  }

  const tenant = getTenantConfig(tenantSlug);
  const { error } = await getSupabaseClient("service").from("content_ideas").insert({
    tenant_id: tenant.identity.tenantId,
    topic,
    category,
    priority,
    target_keyword: targetKeyword || null,
    notes: notes || null,
    status: "new"
  });

  if (error) {
    throw new Error(`Content idea insert failed: ${error.message}`);
  }

  revalidatePath("/admin/content");
  revalidatePath("/admin/content/ideas");
}

export async function recordContentReviewAction(formData: FormData) {
  const tenantSlug = readFormString(formData, "tenantSlug");
  const draftId = readFormString(formData, "draftId");
  const reviewer = readFormString(formData, "reviewer") || "internal-compliance";
  const notes = readFormString(formData, "notes");
  const publicationStatus = readFormString(formData, "publicationStatus") || "draft";

  if (!tenantSlug || !draftId) {
    throw new Error("Tenant and draft are required.");
  }

  const tenant = getTenantConfig(tenantSlug);
  const supabase = getSupabaseClient("service");
  const checklist = Object.fromEntries(
    complianceChecklist.map(([key]) => [key, formData.get(key) === "on"])
  ) as Record<(typeof complianceChecklist)[number][0], boolean>;
  const failedItems = complianceChecklist.filter(([key]) => !checklist[key]);
  const approved = failedItems.length === 0;
  const reviewStatus = approved ? "approved" : "changes_requested";

  const { data: draft, error: draftError } = await supabase
    .from("content_drafts")
    .select("id, slug, title, category")
    .eq("tenant_id", tenant.identity.tenantId)
    .eq("id", draftId)
    .single<{ id: string; slug: string; title: string; category: string }>();

  if (draftError) {
    throw new Error(`Content draft lookup failed: ${draftError.message}`);
  }

  const { data: review, error: reviewError } = await supabase
    .from("content_reviews")
    .insert({
      tenant_id: tenant.identity.tenantId,
      draft_id: draft.id,
      reviewer,
      checklist,
      status: reviewStatus,
      notes: notes || null,
      reviewed_at: new Date().toISOString()
    })
    .select("id")
    .single<{ id: string }>();

  if (reviewError) {
    throw new Error(`Content review insert failed: ${reviewError.message}`);
  }

  await supabase
    .from("content_drafts")
    .update({
      compliance_status: reviewStatus,
      status: approved ? publicationStatus : "review",
      updated_at: new Date().toISOString()
    })
    .eq("tenant_id", tenant.identity.tenantId)
    .eq("id", draft.id);

  if (!approved) {
    const { error: flagError } = await supabase.from("compliance_flags").insert(
      failedItems.map(([key, label]) => ({
        tenant_id: tenant.identity.tenantId,
        draft_id: draft.id,
        review_id: review.id,
        severity: "blocking",
        flag_type: key,
        message: label
      }))
    );

    if (flagError) {
      throw new Error(`Compliance flag insert failed: ${flagError.message}`);
    }
  }

  if (approved && publicationStatus === "published") {
    const { error: publicationError } = await supabase.from("content_publications").upsert(
      {
        tenant_id: tenant.identity.tenantId,
        draft_id: draft.id,
        slug: draft.slug,
        title: draft.title,
        category: draft.category,
        status: "published",
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      { onConflict: "tenant_id,slug" }
    );

    if (publicationError) {
      throw new Error(`Content publication upsert failed: ${publicationError.message}`);
    }
  }

  revalidatePath("/admin/content");
  revalidatePath("/admin/content/review");
  revalidatePath("/admin/content/performance");
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

async function recordContentPerformanceEvent({
  supabase,
  tenantId,
  leadId,
  eventType,
  articleSlug,
  articleCategory,
  ctaVariant
}: {
  supabase: ReturnType<typeof getSupabaseClient>;
  tenantId: string;
  leadId: string;
  eventType: "advisor_assigned_from_article";
  articleSlug: string;
  articleCategory?: string | undefined;
  ctaVariant?: string | undefined;
}) {
  const now = new Date().toISOString();
  const metadata = { articleSlug, articleCategory, ctaVariant };
  const { error } = await supabase.from("events").insert({
    tenant_id: tenantId,
    lead_id: leadId,
    event_type: eventType,
    metadata
  });

  if (error) {
    throw new Error(`Content advisor assignment event insert failed: ${error.message}`);
  }

  const { data, error: performanceError } = await supabase
    .from("content_performance")
    .select("id, advisor_assignments")
    .eq("tenant_id", tenantId)
    .eq("slug", articleSlug)
    .maybeSingle<{ id: string; advisor_assignments: number | null }>();

  if (performanceError) {
    throw new Error(`Content performance lookup failed: ${performanceError.message}`);
  }

  if (!data) {
    await supabase.from("content_performance").insert({
      tenant_id: tenantId,
      slug: articleSlug,
      advisor_assignments: 1,
      last_event_at: now,
      updated_at: now
    });
    return;
  }

  await supabase
    .from("content_performance")
    .update({
      advisor_assignments: (data.advisor_assignments ?? 0) + 1,
      last_event_at: now,
      updated_at: now
    })
    .eq("id", data.id);
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

function readRecordString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}
