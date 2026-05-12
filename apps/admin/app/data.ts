import type { SupabaseClient } from "@supabase/supabase-js";
import { getTenantConfig, listTenantConfigs } from "@ble/core/tenant-config";
import type { TenantConfig } from "@ble/tenant-schema";
import { getSupabaseClient } from "@ble/db";

export type AdminDataState<T> =
  | { status: "ready"; data: T }
  | { status: "unavailable"; reason: string };

export type LeadRow = {
  id: string;
  email: string | null;
  phone: string | null;
  status: string;
  score: number;
  first_name: string | null;
  last_name: string | null;
  retirement_score: number | null;
  score_band: string | null;
  income_preference: string | null;
  annuity_intent_score: number | null;
  annuity_intent_band: string | null;
  annuity_intent_segment: string | null;
  annuity_intent_reasons: string[] | null;
  automation_priority: string | null;
  recommended_action: string | null;
  next_best_email_id: string | null;
  assigned_advisor_id: string | null;
  advisor_notes: string | null;
  appointment_booked_at: string | null;
  appointment_held_at: string | null;
  case_opened_at: string | null;
  case_closed_at: string | null;
  premium_amount: number | null;
  override_earned: number | null;
  source: Record<string, unknown>;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type AdvisorRow = {
  id: string;
  name: string;
  email: string;
  geography: string;
  current_capacity: number;
  accepting_leads: boolean;
};

export type LeadEventRow = {
  id: string;
  event_name: string;
  payload: Record<string, unknown>;
  created_at: string;
};

export type EmailSendStats = {
  total: number;
  pending: number;
  sent: number;
  opened: number;
  clicked: number;
  suppressed: number;
};

export type FunnelStats = {
  totalEvents: number;
  completedLeads: number;
  stepCounts: Record<string, number>;
  sources: Record<string, number>;
  scoreBands: Record<string, number>;
  emailOpenRate: number;
  emailClickRate: number;
  advisorHandoffRate: number;
  closeRate: number;
  totalAdSpend: number;
  costPerLead: number;
  costPerClosedCase: number;
};

export type ContentOpsOverview = {
  ideas: number;
  drafts: number;
  pendingReviews: number;
  published: number;
  unresolvedFlags: number;
  recentAgentRuns: AgentRunRow[];
};

export type ContentIdeaRow = {
  id: string;
  topic: string;
  category: string;
  status: string;
  priority: string;
  target_keyword: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ContentDraftRow = {
  id: string;
  slug: string;
  title: string;
  category: string;
  status: string;
  author_type: string;
  compliance_status: string;
  cta_variant: string;
  word_count: number;
  updated_at: string;
};

export type ComplianceFlagRow = {
  id: string;
  draft_id: string | null;
  severity: string;
  flag_type: string;
  message: string;
  resolved_at: string | null;
  created_at: string;
};

export type ContentReviewRow = {
  id: string;
  draft_id: string | null;
  reviewer: string;
  status: string;
  checklist: Record<string, unknown>;
  notes: string | null;
  reviewed_at: string | null;
  created_at: string;
};

export type ContentReviewQueue = {
  drafts: ContentDraftRow[];
  flags: ComplianceFlagRow[];
  reviews: ContentReviewRow[];
};

export type AgentRunRow = {
  id: string;
  run_type: string;
  agent_name: string;
  status: string;
  created_at: string;
  completed_at: string | null;
};

export type AgentLeadStatsInput = {
  annuity_intent_band: string | null;
  recommended_action: string | null;
  automation_priority: string | null;
};

export type AgentLeadStats = {
  highIntent: number;
  mediumIntent: number;
  lowIntent: number;
  hotPriority: number;
  priorityReviews: number;
};

export type LeadIntelligenceRow = {
  id: string;
  lead_id: string;
  summary: string;
  intent_score: number;
  intent_band: string;
  intent_segment: string;
  urgency: string;
  automation_priority: string;
  recommended_next_action: string;
  next_best_email_id: string | null;
  signals: Record<string, unknown>;
  missing_fields: string[];
  risk_flags: string[];
  advisor_talking_points: string[];
  updated_at: string;
};

export type AdvisorRoutingRecommendationRow = {
  id: string;
  lead_id: string;
  advisor_id: string;
  rank: number;
  score: number;
  rationale: string;
  reasons: string[];
  status: string;
  created_at: string;
};

export type AgentOpsLeadRow = {
  lead: LeadRow;
  intelligence: LeadIntelligenceRow | null;
  recommendation: AdvisorRoutingRecommendationRow | null;
};

export type LeadAgentOps = {
  stats: AgentLeadStats;
  intelligenceCoverage: number;
  pendingRecommendations: number;
  recentAgentRuns: AgentRunRow[];
  queue: AgentOpsLeadRow[];
};

export type ContentPublicationInput = {
  slug: string;
  title: string;
  category: string;
  status: string;
  published_at: string | null;
};

export type ContentEventInput = {
  event_type: string;
  metadata: Record<string, unknown>;
};

export type ContentPerformanceRow = {
  slug: string;
  title: string;
  category: string;
  status: string;
  publishedAt: string | null;
  views: number;
  ctaClicks: number;
  quizStarts: number;
  leadCaptures: number;
  phoneCaptures: number;
  advisorAssignments: number;
  leadCaptureRate: number;
};

export type TenantDashboardStats = {
  totalLeads: number;
  quizCompletionRate: number;
  emailOpenRate: number;
  emailClickRate: number;
  affiliateClicks: number;
  estimatedConversions: number;
  variantPerformance: VariantPerformance;
};

export type VariantPerformanceRow = {
  variantId: string;
  leads: number;
  partials: number;
  sends: number;
  openRate: number;
  clickRate: number;
  affiliateClicks: number;
  estimatedConversions: number;
};

export type VariantPerformance = {
  quizVariants: VariantPerformanceRow[];
  emailVariants: VariantPerformanceRow[];
};

type VariantLeadRow = {
  status: string;
  quiz_variant: string | null;
  email_variant: string | null;
};

type VariantEmailSendRow = {
  status: string;
  opened_at: string | null;
  clicked_at: string | null;
  variant_id: string | null;
};

type VariantEventRow = {
  event_type: string;
  metadata: Record<string, unknown>;
};

export type AdminOverview = {
  tenants: number;
  openLeads: number;
  pendingEmails: number;
  crmRetries: number;
};

function getServiceClient(): AdminDataState<SupabaseClient> {
  try {
    return { status: "ready", data: getSupabaseClient("service") };
  } catch (error) {
    return {
      status: "unavailable",
      reason: error instanceof Error ? error.message : "Supabase service client is unavailable"
    };
  }
}

export function resolveAdminTenant(slug?: string): TenantConfig {
  const tenants = listTenantConfigs();
  const selected = slug ? tenants.find((tenant) => tenant.identity.slug === slug) : undefined;
  return selected ?? tenants[0] ?? getTenantConfig("demo");
}

export async function getAdminOverview(): Promise<AdminDataState<AdminOverview>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const [leads, emailSends, crmSync] = await Promise.all([
    client.data.from("leads").select("id", { count: "exact", head: true }).neq("status", "partial"),
    client.data.from("email_sends").select("id", { count: "exact", head: true }).eq("status", "pending"),
    client.data.from("crm_sync_log").select("id", { count: "exact", head: true }).in("status", ["retry", "dead_letter"])
  ]);

  const error = leads.error ?? emailSends.error ?? crmSync.error;
  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  return {
    status: "ready",
    data: {
      tenants: listTenantConfigs().length,
      openLeads: leads.count ?? 0,
      pendingEmails: emailSends.count ?? 0,
      crmRetries: crmSync.count ?? 0
    }
  };
}

export async function getLeadRows(tenant: TenantConfig): Promise<AdminDataState<LeadRow[]>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const { data, error } = await client.data
    .from("leads")
    .select(
      "id, email, phone, status, score, first_name, last_name, retirement_score, score_band, income_preference, annuity_intent_score, annuity_intent_band, annuity_intent_segment, annuity_intent_reasons, automation_priority, recommended_action, next_best_email_id, assigned_advisor_id, advisor_notes, appointment_booked_at, appointment_held_at, case_opened_at, case_closed_at, premium_amount, override_earned, source, data, created_at, updated_at"
    )
    .eq("tenant_id", tenant.identity.tenantId)
    .order("annuity_intent_score", { ascending: false, nullsFirst: false })
    .order("retirement_score", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100)
    .overrideTypes<LeadRow[], { merge: false }>();

  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  return { status: "ready", data };
}

export async function getLeadAgentOps(tenant: TenantConfig): Promise<AdminDataState<LeadAgentOps>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const [leads, intelligence, recommendations, runs] = await Promise.all([
    client.data
      .from("leads")
      .select(
        "id, email, phone, status, score, first_name, last_name, retirement_score, score_band, income_preference, annuity_intent_score, annuity_intent_band, annuity_intent_segment, annuity_intent_reasons, automation_priority, recommended_action, next_best_email_id, assigned_advisor_id, advisor_notes, appointment_booked_at, appointment_held_at, case_opened_at, case_closed_at, premium_amount, override_earned, source, data, created_at, updated_at"
      )
      .eq("tenant_id", tenant.identity.tenantId)
      .order("annuity_intent_score", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(100)
      .overrideTypes<LeadRow[], { merge: false }>(),
    client.data
      .from("lead_intelligence")
      .select(
        "id, lead_id, summary, intent_score, intent_band, intent_segment, urgency, automation_priority, recommended_next_action, next_best_email_id, signals, missing_fields, risk_flags, advisor_talking_points, updated_at"
      )
      .eq("tenant_id", tenant.identity.tenantId)
      .order("updated_at", { ascending: false })
      .limit(200)
      .overrideTypes<LeadIntelligenceRow[], { merge: false }>(),
    client.data
      .from("advisor_routing_recommendations")
      .select("id, lead_id, advisor_id, rank, score, rationale, reasons, status, created_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .eq("status", "pending")
      .order("rank", { ascending: true })
      .order("score", { ascending: false })
      .limit(200)
      .overrideTypes<AdvisorRoutingRecommendationRow[], { merge: false }>(),
    client.data
      .from("agent_runs")
      .select("id, run_type, agent_name, status, created_at, completed_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .in("run_type", ["lead_intelligence", "advisor_routing", "lead_nurture", "compliance_guardrail"])
      .order("created_at", { ascending: false })
      .limit(10)
      .overrideTypes<AgentRunRow[], { merge: false }>()
  ]);

  const error = leads.error ?? intelligence.error ?? recommendations.error ?? runs.error;
  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  const leadRows = leads.data ?? [];
  const intelligenceRows = intelligence.data ?? [];
  const recommendationRows = recommendations.data ?? [];
  const intelligenceByLead = new Map(intelligenceRows.map((row) => [row.lead_id, row]));
  const recommendationByLead = new Map<string, AdvisorRoutingRecommendationRow>();

  for (const recommendation of recommendationRows) {
    if (!recommendationByLead.has(recommendation.lead_id)) {
      recommendationByLead.set(recommendation.lead_id, recommendation);
    }
  }

  return {
    status: "ready",
    data: {
      stats: summarizeAgentLeadStats(leadRows),
      intelligenceCoverage: ratio(intelligenceRows.length, leadRows.length),
      pendingRecommendations: recommendationRows.length,
      recentAgentRuns: runs.data ?? [],
      queue: leadRows.map((lead) => ({
        lead,
        intelligence: intelligenceByLead.get(lead.id) ?? null,
        recommendation: recommendationByLead.get(lead.id) ?? null
      }))
    }
  };
}

export async function getAdvisors(tenant: TenantConfig): Promise<AdminDataState<AdvisorRow[]>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const { data, error } = await client.data
    .from("advisors")
    .select("id, name, email, geography, current_capacity, accepting_leads")
    .eq("tenant_id", tenant.identity.tenantId)
    .order("accepting_leads", { ascending: false })
    .order("current_capacity", { ascending: true })
    .overrideTypes<AdvisorRow[], { merge: false }>();

  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  return { status: "ready", data };
}

export async function getLeadTimeline(tenant: TenantConfig): Promise<AdminDataState<LeadEventRow[]>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const { data, error } = await client.data
    .from("lead_events")
    .select("id, event_name, payload, created_at")
    .eq("tenant_id", tenant.identity.tenantId)
    .order("created_at", { ascending: false })
    .limit(25)
    .overrideTypes<LeadEventRow[], { merge: false }>();

  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  return { status: "ready", data };
}

export async function getFunnelStats(tenant: TenantConfig): Promise<AdminDataState<FunnelStats>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const [leadEvents, leads, emailSends, adSpend] = await Promise.all([
    client.data
      .from("lead_events")
      .select("event_name, payload")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<Array<{ event_name: string; payload: Record<string, unknown> }>, { merge: false }>(),
    client.data
      .from("leads")
      .select("status, score_band, assigned_advisor_id, case_closed_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<
        Array<{ status: string; score_band: string | null; assigned_advisor_id: string | null; case_closed_at: string | null }>,
        { merge: false }
      >(),
    client.data
      .from("email_sends")
      .select("status, opened_at, clicked_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<Array<{ status: string; opened_at: string | null; clicked_at: string | null }>, { merge: false }>(),
    client.data
      .from("ad_spend")
      .select("amount")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<Array<{ amount: number }>, { merge: false }>()
  ]);

  const error = leadEvents.error ?? leads.error ?? emailSends.error ?? adSpend.error;
  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  const leadEventRows = leadEvents.data ?? [];
  const leadRows = leads.data ?? [];
  const emailSendRows = emailSends.data ?? [];
  const adSpendRows = adSpend.data ?? [];
  const stepCounts: Record<string, number> = {};
  const sources: Record<string, number> = {};
  const scoreBands: Record<string, number> = {};
  let completedLeads = 0;

  for (const event of leadEventRows) {
    const stepId = typeof event.payload.stepId === "string" ? event.payload.stepId : "unknown";
    stepCounts[stepId] = (stepCounts[stepId] ?? 0) + 1;

    if (event.event_name === "LeadCompleted") {
      completedLeads += 1;
    }

    const source = event.payload.source;
    if (source && typeof source === "object" && !Array.isArray(source)) {
      const sourceRecord = source as Record<string, unknown>;
      const utmSource = typeof sourceRecord.utmSource === "string" ? sourceRecord.utmSource : "direct";
      sources[utmSource] = (sources[utmSource] ?? 0) + 1;
    }
  }

  for (const lead of leadRows) {
    if (lead.score_band) {
      scoreBands[lead.score_band] = (scoreBands[lead.score_band] ?? 0) + 1;
    }
  }

  const totalLeads = leadRows.filter((lead) => lead.status !== "partial").length;
  const advisorHandoffs = leadRows.filter((lead) => lead.assigned_advisor_id).length;
  const closedCases = leadRows.filter((lead) => lead.case_closed_at).length;
  const sentEmails = emailSendRows.filter((send) => send.status === "sent").length;
  const openedEmails = emailSendRows.filter((send) => send.opened_at).length;
  const clickedEmails = emailSendRows.filter((send) => send.clicked_at).length;
  const totalAdSpend = adSpendRows.reduce((sum, row) => sum + row.amount, 0);

  return {
    status: "ready",
    data: {
      totalEvents: leadEventRows.length,
      completedLeads,
      stepCounts,
      sources,
      scoreBands,
      emailOpenRate: ratio(openedEmails, sentEmails),
      emailClickRate: ratio(clickedEmails, sentEmails),
      advisorHandoffRate: ratio(advisorHandoffs, totalLeads),
      closeRate: ratio(closedCases, totalLeads),
      totalAdSpend,
      costPerLead: totalLeads === 0 ? 0 : Math.round(totalAdSpend / totalLeads),
      costPerClosedCase: closedCases === 0 ? 0 : Math.round(totalAdSpend / closedCases)
    }
  };
}

export async function getContentOpsOverview(tenant: TenantConfig): Promise<AdminDataState<ContentOpsOverview>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const [ideas, drafts, reviews, publications, flags, runs] = await Promise.all([
    client.data.from("content_ideas").select("id", { count: "exact", head: true }).eq("tenant_id", tenant.identity.tenantId),
    client.data
      .from("content_drafts")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.identity.tenantId)
      .eq("status", "draft"),
    client.data
      .from("content_reviews")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.identity.tenantId)
      .eq("status", "pending"),
    client.data
      .from("content_publications")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.identity.tenantId)
      .eq("status", "published"),
    client.data
      .from("compliance_flags")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.identity.tenantId)
      .is("resolved_at", null),
    client.data
      .from("agent_runs")
      .select("id, run_type, agent_name, status, created_at, completed_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .order("created_at", { ascending: false })
      .limit(5)
      .overrideTypes<AgentRunRow[], { merge: false }>()
  ]);

  const error = ideas.error ?? drafts.error ?? reviews.error ?? publications.error ?? flags.error ?? runs.error;
  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  return {
    status: "ready",
    data: {
      ideas: ideas.count ?? 0,
      drafts: drafts.count ?? 0,
      pendingReviews: reviews.count ?? 0,
      published: publications.count ?? 0,
      unresolvedFlags: flags.count ?? 0,
      recentAgentRuns: runs.data ?? []
    }
  };
}

export async function getContentIdeas(tenant: TenantConfig): Promise<AdminDataState<ContentIdeaRow[]>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const { data, error } = await client.data
    .from("content_ideas")
    .select("id, topic, category, status, priority, target_keyword, notes, created_at, updated_at")
    .eq("tenant_id", tenant.identity.tenantId)
    .order("created_at", { ascending: false })
    .limit(100)
    .overrideTypes<ContentIdeaRow[], { merge: false }>();

  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  return { status: "ready", data };
}

export async function getContentReviewQueue(tenant: TenantConfig): Promise<AdminDataState<ContentReviewQueue>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const [drafts, flags, reviews] = await Promise.all([
    client.data
      .from("content_drafts")
      .select("id, slug, title, category, status, author_type, compliance_status, cta_variant, word_count, updated_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .in("status", ["draft", "review", "published"])
      .order("updated_at", { ascending: false })
      .limit(100)
      .overrideTypes<ContentDraftRow[], { merge: false }>(),
    client.data
      .from("compliance_flags")
      .select("id, draft_id, severity, flag_type, message, resolved_at, created_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(100)
      .overrideTypes<ComplianceFlagRow[], { merge: false }>(),
    client.data
      .from("content_reviews")
      .select("id, draft_id, reviewer, status, checklist, notes, reviewed_at, created_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .order("created_at", { ascending: false })
      .limit(50)
      .overrideTypes<ContentReviewRow[], { merge: false }>()
  ]);

  const error = drafts.error ?? flags.error ?? reviews.error;
  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  return {
    status: "ready",
    data: {
      drafts: drafts.data ?? [],
      flags: flags.data ?? [],
      reviews: reviews.data ?? []
    }
  };
}

export async function getContentPerformance(tenant: TenantConfig): Promise<AdminDataState<ContentPerformanceRow[]>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const trackedEvents = [
    "article_viewed",
    "cta_clicked",
    "quiz_started_from_article",
    "lead_captured_from_article",
    "phone_captured_from_article",
    "advisor_assigned_from_article"
  ];
  const [publications, events] = await Promise.all([
    client.data
      .from("content_publications")
      .select("slug, title, category, status, published_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .order("published_at", { ascending: false })
      .overrideTypes<ContentPublicationInput[], { merge: false }>(),
    client.data
      .from("events")
      .select("event_type, metadata")
      .eq("tenant_id", tenant.identity.tenantId)
      .in("event_type", trackedEvents)
      .overrideTypes<ContentEventInput[], { merge: false }>()
  ]);

  const error = publications.error ?? events.error;
  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  return {
    status: "ready",
    data: summarizeContentPerformance({
      publications: publications.data ?? [],
      events: events.data ?? []
    })
  };
}

export async function getEmailSendStats(tenant: TenantConfig): Promise<AdminDataState<EmailSendStats>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const [sends, suppressions] = await Promise.all([
    client.data
      .from("email_sends")
      .select("status, opened_at, clicked_at")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<Array<{ status: string; opened_at: string | null; clicked_at: string | null }>, { merge: false }>(),
    client.data
      .from("email_suppressions")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.identity.tenantId)
  ]);

  if (sends.error) {
    return { status: "unavailable", reason: sends.error.message };
  }

  if (suppressions.error) {
    return { status: "unavailable", reason: suppressions.error.message };
  }

  return {
    status: "ready",
    data: {
      total: sends.data.length,
      pending: sends.data.filter((send) => send.status === "pending").length,
      sent: sends.data.filter((send) => send.status === "sent").length,
      opened: sends.data.filter((send) => send.opened_at).length,
      clicked: sends.data.filter((send) => send.clicked_at).length,
      suppressed: suppressions.count ?? 0
    }
  };
}

export async function getTenantDashboardStats(
  tenant: TenantConfig
): Promise<AdminDataState<TenantDashboardStats>> {
  const client = getServiceClient();
  if (client.status === "unavailable") {
    return client;
  }

  const [leads, leadEvents, emailSends, events] = await Promise.all([
    client.data
      .from("leads")
      .select("id, status, quiz_variant, email_variant")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<Array<{ id: string } & VariantLeadRow>, { merge: false }>(),
    client.data
      .from("lead_events")
      .select("event_name")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<Array<{ event_name: string }>, { merge: false }>(),
    client.data
      .from("email_sends")
      .select("status, opened_at, clicked_at, variant_id")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<VariantEmailSendRow[], { merge: false }>(),
    client.data
      .from("events")
      .select("event_type, metadata")
      .eq("tenant_id", tenant.identity.tenantId)
      .overrideTypes<VariantEventRow[], { merge: false }>()
  ]);

  const error = leads.error ?? leadEvents.error ?? emailSends.error ?? events.error;
  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  const leadRows = leads.data ?? [];
  const leadEventRows = leadEvents.data ?? [];
  const emailSendRows = emailSends.data ?? [];
  const eventRows = events.data ?? [];
  const totalLeads = leadRows.filter((lead) => lead.status !== "partial").length;
  const partialEvents = leadEventRows.filter((event) => event.event_name !== "LeadCompleted").length;
  const completedEvents = leadEventRows.filter((event) => event.event_name === "LeadCompleted").length;
  const sentEmails = emailSendRows.filter((send) => send.status === "sent").length;
  const openedEmails = emailSendRows.filter((send) => send.opened_at).length;
  const clickedEmails = emailSendRows.filter((send) => send.clicked_at).length;
  const affiliateClicks = eventRows.filter((event) => event.event_type === "affiliate.clicked").length;
  const variantPerformance = summarizeVariantStats({
    leads: leadRows,
    emailSends: emailSendRows,
    events: eventRows
  });

  return {
    status: "ready",
    data: {
      totalLeads,
      quizCompletionRate: ratio(completedEvents, completedEvents + partialEvents),
      emailOpenRate: ratio(openedEmails, sentEmails),
      emailClickRate: ratio(clickedEmails, sentEmails),
      affiliateClicks,
      estimatedConversions: Math.round(affiliateClicks * 0.12),
      variantPerformance
    }
  };
}

export function summarizeVariantStats(input: {
  leads: VariantLeadRow[];
  emailSends: VariantEmailSendRow[];
  events: VariantEventRow[];
}): VariantPerformance {
  const quizVariants = new Map<string, VariantAccumulator>();
  const emailVariants = new Map<string, VariantAccumulator>();

  for (const lead of input.leads) {
    if (lead.quiz_variant) {
      const row = ensureVariant(quizVariants, lead.quiz_variant);
      if (lead.status === "partial") {
        row.partials += 1;
      } else {
        row.leads += 1;
      }
    }

    if (lead.email_variant) {
      const row = ensureVariant(emailVariants, lead.email_variant);
      if (lead.status === "partial") {
        row.partials += 1;
      } else {
        row.leads += 1;
      }
    }
  }

  for (const send of input.emailSends) {
    if (!send.variant_id) {
      continue;
    }

    const row = ensureVariant(emailVariants, send.variant_id);
    if (send.status === "sent") {
      row.sends += 1;
      if (send.opened_at) {
        row.opens += 1;
      }
      if (send.clicked_at) {
        row.clicks += 1;
      }
    }
  }

  for (const event of input.events) {
    if (event.event_type !== "affiliate.clicked") {
      continue;
    }

    const quizVariant = readMetadataString(event.metadata, "quizVariant");
    if (quizVariant) {
      ensureVariant(quizVariants, quizVariant).affiliateClicks += 1;
    }

    const emailVariant = readMetadataString(event.metadata, "emailVariant");
    if (emailVariant) {
      ensureVariant(emailVariants, emailVariant).affiliateClicks += 1;
    }
  }

  return {
    quizVariants: mapVariantRows(quizVariants),
    emailVariants: mapVariantRows(emailVariants)
  };
}

export function summarizeContentPerformance(input: {
  publications: ContentPublicationInput[];
  events: ContentEventInput[];
}): ContentPerformanceRow[] {
  const rows = new Map<string, ContentPerformanceAccumulator>();

  for (const publication of input.publications) {
    rows.set(publication.slug, {
      slug: publication.slug,
      title: publication.title,
      category: publication.category,
      status: publication.status,
      publishedAt: publication.published_at,
      views: 0,
      ctaClicks: 0,
      quizStarts: 0,
      leadCaptures: 0,
      phoneCaptures: 0,
      advisorAssignments: 0
    });
  }

  for (const event of input.events) {
    const slug = readMetadataString(event.metadata, "articleSlug") ?? readMetadataString(event.metadata, "slug");
    if (!slug) {
      continue;
    }

    const row =
      rows.get(slug) ??
      ensureContentPerformance(rows, {
        slug,
        title: slug,
        category: readMetadataString(event.metadata, "articleCategory") ?? "Unknown",
        status: "untracked",
        publishedAt: null,
        views: 0,
        ctaClicks: 0,
        quizStarts: 0,
        leadCaptures: 0,
        phoneCaptures: 0,
        advisorAssignments: 0
      });

    if (event.event_type === "article_viewed") {
      row.views += 1;
    } else if (event.event_type === "cta_clicked") {
      row.ctaClicks += 1;
    } else if (event.event_type === "quiz_started_from_article") {
      row.quizStarts += 1;
    } else if (event.event_type === "lead_captured_from_article") {
      row.leadCaptures += 1;
    } else if (event.event_type === "phone_captured_from_article") {
      row.phoneCaptures += 1;
    } else if (event.event_type === "advisor_assigned_from_article") {
      row.advisorAssignments += 1;
    }
  }

  return [...rows.values()]
    .map((row) => ({
      ...row,
      leadCaptureRate: ratio(row.leadCaptures, row.views)
    }))
    .sort((a, b) => b.views - a.views || a.title.localeCompare(b.title));
}

export function summarizeAgentLeadStats(rows: AgentLeadStatsInput[]): AgentLeadStats {
  return rows.reduce<AgentLeadStats>(
    (stats, row) => {
      if (row.annuity_intent_band === "High") {
        stats.highIntent += 1;
      } else if (row.annuity_intent_band === "Medium") {
        stats.mediumIntent += 1;
      } else if (row.annuity_intent_band === "Low") {
        stats.lowIntent += 1;
      }

      if (row.automation_priority === "hot") {
        stats.hotPriority += 1;
      }

      if (row.recommended_action === "priority_advisor_review") {
        stats.priorityReviews += 1;
      }

      return stats;
    },
    {
      highIntent: 0,
      mediumIntent: 0,
      lowIntent: 0,
      hotPriority: 0,
      priorityReviews: 0
    }
  );
}

type ContentPerformanceAccumulator = Omit<ContentPerformanceRow, "leadCaptureRate">;

function ensureContentPerformance(
  rows: Map<string, ContentPerformanceAccumulator>,
  row: ContentPerformanceAccumulator
): ContentPerformanceAccumulator {
  rows.set(row.slug, row);
  return row;
}

type VariantAccumulator = {
  variantId: string;
  leads: number;
  partials: number;
  sends: number;
  opens: number;
  clicks: number;
  affiliateClicks: number;
};

function ensureVariant(variants: Map<string, VariantAccumulator>, variantId: string): VariantAccumulator {
  const existing = variants.get(variantId);
  if (existing) {
    return existing;
  }

  const created = {
    variantId,
    leads: 0,
    partials: 0,
    sends: 0,
    opens: 0,
    clicks: 0,
    affiliateClicks: 0
  };
  variants.set(variantId, created);
  return created;
}

function mapVariantRows(variants: Map<string, VariantAccumulator>): VariantPerformanceRow[] {
  return [...variants.values()].map((variant) => ({
    variantId: variant.variantId,
    leads: variant.leads,
    partials: variant.partials,
    sends: variant.sends,
    openRate: ratio(variant.opens, variant.sends),
    clickRate: ratio(variant.clicks, variant.sends),
    affiliateClicks: variant.affiliateClicks,
    estimatedConversions: Math.round(variant.affiliateClicks * 0.12)
  }));
}

function readMetadataString(metadata: Record<string, unknown>, key: string): string | undefined {
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

function ratio(numerator: number, denominator: number) {
  if (denominator === 0) {
    return 0;
  }

  return Math.round((numerator / denominator) * 100);
}
