"use server";

import { revalidatePath } from "next/cache";
import { getTenantConfig } from "@ble/core/tenant-config";
import { getSupabaseClient } from "@ble/db";
import {
  calculateAnnuityBuyerIntent,
  type IncomePreference
} from "@ble/tenant-retire-ready-mn/lib/annuity-intent-engine";
import type { PrimaryConcern, SavingsBucket } from "@ble/tenant-retire-ready-mn/lib/retirement-score-engine";

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

export async function runRetireReadyLeadAgentsAction(formData: FormData) {
  const tenantSlug = readFormString(formData, "tenantSlug") || "retire-ready-mn";
  const tenant = getTenantConfig(tenantSlug);

  if (tenant.identity.slug !== "retire-ready-mn") {
    throw new Error("Lead agent automation is currently scoped to RetireReadyMN.");
  }

  const supabase = getSupabaseClient("service");
  const now = new Date().toISOString();
  const { data: leads, error: leadError } = await supabase
    .from("leads")
    .select(
      "id, email, phone, first_name, last_name, age, current_savings, target_retirement_age, monthly_social_security, desired_monthly_income, source, data, assigned_advisor_id"
    )
    .eq("tenant_id", tenant.identity.tenantId)
    .order("created_at", { ascending: false })
    .limit(100)
    .overrideTypes<LeadAutomationRow[], { merge: false }>();

  if (leadError) {
    throw new Error(`Lead agent lookup failed: ${leadError.message}`);
  }

  const { data: advisors, error: advisorError } = await supabase
    .from("advisors")
    .select("id, name, geography, current_capacity, accepting_leads")
    .eq("tenant_id", tenant.identity.tenantId)
    .eq("accepting_leads", true)
    .order("current_capacity", { ascending: true })
    .limit(25)
    .overrideTypes<AdvisorAutomationRow[], { merge: false }>();

  if (advisorError) {
    throw new Error(`Advisor agent lookup failed: ${advisorError.message}`);
  }

  const { data: runs, error: runError } = await supabase
    .from("agent_runs")
    .insert(
      [
        {
          tenant_id: tenant.identity.tenantId,
          run_type: "lead_intelligence",
          agent_name: "Annuity Intent Qualification Agent",
          status: "running",
          input: { tenantSlug, limit: 100 },
          started_at: now
        },
        {
          tenant_id: tenant.identity.tenantId,
          run_type: "advisor_routing",
          agent_name: "Minnesota Advisor Routing Agent",
          status: "running",
          input: { tenantSlug, availableAdvisors: advisors.length },
          started_at: now
        },
        {
          tenant_id: tenant.identity.tenantId,
          run_type: "lead_nurture",
          agent_name: "Educational Nurture Selection Agent",
          status: "running",
          input: { tenantSlug },
          started_at: now
        },
        {
          tenant_id: tenant.identity.tenantId,
          run_type: "compliance_guardrail",
          agent_name: "RetireReadyMN Compliance Guardrail Agent",
          status: "running",
          input: {
            tenantSlug,
            checks: ["no_guarantees", "no_product_recommendation", "advisor_identity_internal_only"]
          },
          started_at: now
        }
      ]
    )
    .select("id, run_type")
    .overrideTypes<Array<{ id: string; run_type: string }>, { merge: false }>();

  if (runError) {
    throw new Error(`Agent run creation failed: ${runError.message}`);
  }

  const runIds = new Map(runs.map((run) => [run.run_type, run.id]));
  const leadIntelligenceRunId = runIds.get("lead_intelligence") ?? null;
  const advisorRoutingRunId = runIds.get("advisor_routing") ?? null;
  const leadRows = leads;
  const advisorRows = advisors;
  let processed = 0;
  let highIntent = 0;
  let recommendationsCreated = 0;
  let complianceFlags = 0;
  const nextBestEmailCounts = new Map<string, number>();

  for (const lead of leadRows) {
    const input = buildAnnuityInput(lead);
    const intent = calculateAnnuityBuyerIntent(input);
    const missingFields = listMissingFields(lead);
    const riskFlags = buildRiskFlags({ lead, intent, missingFields });
    const topAdvisor = chooseAdvisor(advisorRows, intent.score);
    const advisorTalkingPoints = [
      ...intent.advisorTalkingPoints,
      "Your score is a starting point, not a recommendation.",
      "Compare tradeoffs before discussing any specific product."
    ];

    processed += 1;
    if (intent.band === "High") {
      highIntent += 1;
    }
    complianceFlags += riskFlags.length;
    nextBestEmailCounts.set(intent.nextBestEmailId, (nextBestEmailCounts.get(intent.nextBestEmailId) ?? 0) + 1);

    const signals = {
      reasons: intent.reasons,
      source: lead.source,
      score: intent.score,
      band: intent.band,
      segment: intent.segment
    };

    const [{ error: updateLeadError }, { error: intelError }, { error: eventError }] = await Promise.all([
      supabase
        .from("leads")
        .update({
          income_preference: input.incomePreference,
          annuity_intent_score: intent.score,
          annuity_intent_band: intent.band,
          annuity_intent_segment: intent.segment,
          annuity_intent_reasons: intent.reasons,
          automation_priority: intent.automationPriority,
          recommended_action: intent.recommendedAction,
          next_best_email_id: intent.nextBestEmailId,
          updated_at: new Date().toISOString()
        })
        .eq("tenant_id", tenant.identity.tenantId)
        .eq("id", lead.id),
      supabase.from("lead_intelligence").upsert(
        {
          tenant_id: tenant.identity.tenantId,
          lead_id: lead.id,
          agent_run_id: leadIntelligenceRunId,
          summary: intent.summary,
          intent_score: intent.score,
          intent_band: intent.band,
          intent_segment: intent.segment,
          urgency: intent.automationPriority === "hot" ? "high" : intent.automationPriority === "warm" ? "medium" : "normal",
          automation_priority: intent.automationPriority,
          recommended_next_action: intent.recommendedAction,
          next_best_email_id: intent.nextBestEmailId,
          signals,
          missing_fields: missingFields,
          risk_flags: riskFlags,
          advisor_talking_points: advisorTalkingPoints,
          updated_at: new Date().toISOString()
        },
        { onConflict: "tenant_id,lead_id" }
      ),
      supabase.from("events").insert({
        tenant_id: tenant.identity.tenantId,
        lead_id: lead.id,
        event_type: "agent.lead_intelligence_updated",
        metadata: {
          annuityIntentScore: intent.score,
          annuityIntentBand: intent.band,
          recommendedAction: intent.recommendedAction,
          automationPriority: intent.automationPriority,
          runId: leadIntelligenceRunId
        }
      })
    ]);

    if (updateLeadError) {
      throw new Error(`Lead intent update failed: ${updateLeadError.message}`);
    }

    if (intelError) {
      throw new Error(`Lead intelligence upsert failed: ${intelError.message}`);
    }

    if (eventError) {
      throw new Error(`Lead intelligence event insert failed: ${eventError.message}`);
    }

    await supabase
      .from("advisor_routing_recommendations")
      .update({ status: "superseded", updated_at: new Date().toISOString() })
      .eq("tenant_id", tenant.identity.tenantId)
      .eq("lead_id", lead.id)
      .eq("status", "pending");

    if (intent.recommendedAction === "priority_advisor_review" && topAdvisor && !lead.assigned_advisor_id) {
      const { error: recommendationError } = await supabase.from("advisor_routing_recommendations").insert({
        tenant_id: tenant.identity.tenantId,
        lead_id: lead.id,
        advisor_id: topAdvisor.id,
        agent_run_id: advisorRoutingRunId,
        rank: 1,
        score: Math.min(100, intent.score + Math.max(0, 10 - topAdvisor.current_capacity)),
        rationale: `High-fit income-floor review candidate in ${topAdvisor.geography}.`,
        reasons: intent.reasons,
        status: "pending"
      });

      if (recommendationError) {
        throw new Error(`Advisor routing recommendation failed: ${recommendationError.message}`);
      }

      recommendationsCreated += 1;
    }
  }

  await Promise.all([
    updateAgentRun(supabase, leadIntelligenceRunId, {
      processed,
      highIntent,
      model: "deterministic-annuity-intent-v1"
    }),
    updateAgentRun(supabase, advisorRoutingRunId, {
      recommendationsCreated,
      availableAdvisors: advisorRows.length
    }),
    updateAgentRun(supabase, runIds.get("lead_nurture") ?? null, {
      nextBestEmailCounts: Object.fromEntries(nextBestEmailCounts)
    }),
    updateAgentRun(supabase, runIds.get("compliance_guardrail") ?? null, {
      flagsRecorded: complianceFlags,
      publicCopyRule: "Educational only; no guarantees, product recommendations, or public advisor identity."
    })
  ]);

  revalidatePath("/admin/agents");
  revalidatePath("/admin/dashboard");
  revalidatePath("/leads");
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

type LeadAutomationRow = {
  id: string;
  email: string | null;
  phone: string | null;
  first_name: string | null;
  last_name: string | null;
  age: number | null;
  current_savings: number | string | null;
  target_retirement_age: number | null;
  monthly_social_security: number | string | null;
  desired_monthly_income: number | string | null;
  source: Record<string, unknown>;
  data: Record<string, unknown>;
  assigned_advisor_id: string | null;
};

type AdvisorAutomationRow = {
  id: string;
  name: string;
  geography: string;
  current_capacity: number;
  accepting_leads: boolean;
};

function buildAnnuityInput(lead: LeadAutomationRow) {
  const currentSavingsBucket =
    readSavingsBucket(readRecordString(lead.data, "currentSavingsBucket")) ??
    savingsBucketFromAmount(numberLike(lead.current_savings)) ??
    "under-250000";
  const primaryConcern = readPrimaryConcern(readRecordString(lead.data, "primaryConcern")) ?? "leaving_legacy";
  const incomePreference = readIncomePreference(readRecordString(lead.data, "incomePreference")) ?? "not_sure";

  return {
    currentAge: readRecordNumber(lead.data, "currentAge") ?? lead.age ?? 0,
    targetRetirementAge:
      readRecordNumber(lead.data, "targetRetirementAge") ?? lead.target_retirement_age ?? 0,
    currentSavingsBucket,
    monthlySocialSecurity:
      readRecordNumber(lead.data, "monthlySocialSecurity") ?? numberLike(lead.monthly_social_security) ?? 0,
    desiredMonthlyIncome:
      readRecordNumber(lead.data, "desiredMonthlyIncome") ?? numberLike(lead.desired_monthly_income) ?? 0,
    primaryConcern,
    incomePreference,
    phone: lead.phone ?? readRecordString(lead.data, "phone"),
    tcpaConsent: readRecordBoolean(lead.data, "tcpaConsent"),
    articleSlug: readRecordString(lead.source, "articleSlug")
  };
}

function listMissingFields(lead: LeadAutomationRow): string[] {
  const missing: string[] = [];
  const data = lead.data;

  if (!lead.email) {
    missing.push("email");
  }
  if (!lead.phone || !readRecordBoolean(data, "tcpaConsent")) {
    missing.push("phone_consent");
  }
  if (!readSavingsBucket(readRecordString(data, "currentSavingsBucket")) && numberLike(lead.current_savings) === null) {
    missing.push("current_savings");
  }
  if (!readIncomePreference(readRecordString(data, "incomePreference"))) {
    missing.push("income_preference");
  }
  if (!readPrimaryConcern(readRecordString(data, "primaryConcern"))) {
    missing.push("primary_concern");
  }

  return missing;
}

function buildRiskFlags({
  lead,
  intent,
  missingFields
}: {
  lead: LeadAutomationRow;
  intent: ReturnType<typeof calculateAnnuityBuyerIntent>;
  missingFields: string[];
}): string[] {
  const flags: string[] = [];

  if (missingFields.length > 0) {
    flags.push("agent_used_defaults");
  }
  if (intent.band === "High" && (!lead.phone || !readRecordBoolean(lead.data, "tcpaConsent"))) {
    flags.push("needs_phone_consent_before_handoff");
  }
  if (intent.segment === "income_floor_ready") {
    flags.push("keep_income_floor_copy_educational");
  }

  return flags;
}

function chooseAdvisor(advisors: AdvisorAutomationRow[], intentScore: number): AdvisorAutomationRow | null {
  if (intentScore < 70) {
    return null;
  }

  return advisors.find((advisor) => advisor.accepting_leads) ?? null;
}

async function updateAgentRun(
  supabase: ReturnType<typeof getSupabaseClient>,
  runId: string | null,
  output: Record<string, unknown>
) {
  if (!runId) {
    return;
  }

  const { error } = await supabase
    .from("agent_runs")
    .update({
      status: "completed",
      output,
      completed_at: new Date().toISOString()
    })
    .eq("id", runId);

  if (error) {
    throw new Error(`Agent run update failed: ${error.message}`);
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

function readRecordNumber(record: Record<string, unknown>, key: string): number | null {
  return numberLike(record[key]);
}

function readRecordBoolean(record: Record<string, unknown>, key: string): boolean {
  const value = record[key];
  if (typeof value === "boolean") {
    return value;
  }

  return value === "true";
}

function readRecordString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function numberLike(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readSavingsBucket(value: string | undefined): SavingsBucket | null {
  if (
    value === "under-250000" ||
    value === "250000-500000" ||
    value === "500000-1000000" ||
    value === "1000000-2000000" ||
    value === "over-2000000"
  ) {
    return value;
  }

  return null;
}

function savingsBucketFromAmount(value: number | null): SavingsBucket | null {
  if (value === null) {
    return null;
  }

  if (value < 250_000) {
    return "under-250000";
  }
  if (value < 500_000) {
    return "250000-500000";
  }
  if (value < 1_000_000) {
    return "500000-1000000";
  }
  if (value < 2_000_000) {
    return "1000000-2000000";
  }

  return "over-2000000";
}

function readPrimaryConcern(value: string | undefined): PrimaryConcern | null {
  if (
    value === "outliving_savings" ||
    value === "market_crash" ||
    value === "taxes" ||
    value === "leaving_legacy" ||
    value === "healthcare_costs"
  ) {
    return value;
  }

  return null;
}

function readIncomePreference(value: string | undefined): IncomePreference | null {
  if (
    value === "dependable_income" ||
    value === "growth_flexibility" ||
    value === "tax_efficiency" ||
    value === "legacy_flexibility" ||
    value === "not_sure"
  ) {
    return value;
  }

  return null;
}
