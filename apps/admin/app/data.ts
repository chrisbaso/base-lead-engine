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
  source: Record<string, unknown>;
  data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
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
    .select("id, email, phone, status, score, source, data, created_at, updated_at")
    .eq("tenant_id", tenant.identity.tenantId)
    .order("created_at", { ascending: false })
    .limit(100)
    .overrideTypes<LeadRow[], { merge: false }>();

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

  const { data, error } = await client.data
    .from("lead_events")
    .select("event_name, payload")
    .eq("tenant_id", tenant.identity.tenantId)
    .overrideTypes<Array<{ event_name: string; payload: Record<string, unknown> }>, { merge: false }>();

  if (error) {
    return { status: "unavailable", reason: error.message };
  }

  const stepCounts: Record<string, number> = {};
  const sources: Record<string, number> = {};
  let completedLeads = 0;

  for (const event of data) {
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

  return {
    status: "ready",
    data: {
      totalEvents: data.length,
      completedLeads,
      stepCounts,
      sources
    }
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
