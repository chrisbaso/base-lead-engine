import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { TenantConfig } from "@ble/tenant-schema";
import { retryFetch } from "../retry";
import { getTenantConfig, listTenantConfigs } from "../tenant-config";
import { renderDemoEmailHtml } from "./templates";

export type LeadEmailContext = {
  id: string;
  email: string;
  score: number;
  data: Record<string, unknown>;
};

export type EmailSendRow = {
  id: string;
  tenant_id: string;
  lead_id: string;
  recipient_email: string;
  subject: string;
  template: string;
  sequence_id: string;
};

type ScheduleOptions = {
  supabase: SupabaseClient;
  tenant: TenantConfig;
  lead: LeadEmailContext;
};

type RunOptions = {
  supabase: SupabaseClient;
  now?: Date;
  batchSize?: number;
  resendApiKey: string | undefined;
  appUrl: string;
  leadId?: string;
};

type ResendResult = {
  id?: string;
};

function shouldSchedule(condition: "always" | "qualified" | "nurture", tenant: TenantConfig, lead: LeadEmailContext) {
  if (condition === "always") {
    return true;
  }

  if (condition === "qualified") {
    return lead.score >= tenant.scoring.qualifiedThreshold;
  }

  return lead.score < tenant.scoring.qualifiedThreshold;
}

export function buildUnsubscribeUrl(appUrl: string, tenant: TenantConfig, email: string): string {
  const url = new URL("/unsubscribe", appUrl);
  url.searchParams.set("tenant_id", tenant.identity.tenantId);
  url.searchParams.set("email", email);
  const token = createUnsubscribeToken(tenant.identity.tenantId, email);
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

export function createUnsubscribeToken(tenantId: string, email: string): string | null {
  const secret = process.env.UNSUBSCRIBE_SIGNING_SECRET;
  if (!secret) {
    return null;
  }

  return createHmac("sha256", secret).update(`${tenantId}:${email.toLowerCase()}`).digest("hex");
}

export function verifyUnsubscribeToken(tenantId: string, email: string, token: string | undefined): boolean {
  const expected = createUnsubscribeToken(tenantId, email);
  if (!expected) {
    return true;
  }

  if (!token) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, "hex");
  const tokenBuffer = Buffer.from(token, "hex");

  return expectedBuffer.length === tokenBuffer.length && timingSafeEqual(expectedBuffer, tokenBuffer);
}

export function renderEmailHtml(
  template: string,
  tenant: TenantConfig,
  lead: LeadEmailContext,
  unsubscribeUrl: string,
  appUrl?: string
) {
  return renderDemoEmailHtml({ template, tenant, lead, unsubscribeUrl, appUrl });
}

export async function scheduleEmailSequence(options: ScheduleOptions): Promise<number> {
  if (!options.lead.email) {
    return 0;
  }

  let cumulativeDelayHours = 0;
  const rows = options.tenant.email.sequences
    .map((sequence, index) => {
      cumulativeDelayHours += sequence.delayHours;
      return {
        sequence,
        index,
        scheduledFor: new Date(Date.now() + cumulativeDelayHours * 60 * 60 * 1000)
      };
    })
    .filter(({ sequence }) => shouldSchedule(sequence.condition, options.tenant, options.lead))
    .map(({ sequence, index, scheduledFor }) => ({
      tenant_id: options.tenant.identity.tenantId,
      lead_id: options.lead.id,
      sequence_id: sequence.id,
      step_index: index,
      recipient_email: options.lead.email,
      subject: sequence.subject,
      template: sequence.template,
      status: "pending",
      scheduled_for: scheduledFor.toISOString()
    }));

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await options.supabase.from("email_sends").insert(rows);
  if (error) {
    throw new Error(`Email sequence schedule failed: ${error.message}`);
  }

  return rows.length;
}

export async function runDueEmailSends(options: RunOptions): Promise<{ processed: number; sent: number; skipped: number }> {
  const now = options.now ?? new Date();
  let query = options.supabase
    .from("email_sends")
    .select("id, tenant_id, lead_id, recipient_email, subject, template, sequence_id")
    .eq("status", "pending")
    .lte("scheduled_for", now.toISOString());

  if (options.leadId) {
    query = query.eq("lead_id", options.leadId);
  }

  const { data, error } = await query
    .order("scheduled_for", { ascending: true })
    .limit(options.batchSize ?? 50)
    .overrideTypes<EmailSendRow[], { merge: false }>();

  if (error) {
    throw new Error(`Email send query failed: ${error.message}`);
  }

  let sent = 0;
  let skipped = 0;

  for (const row of data) {
    const tenant = listTenantConfigs().find((config) => config.identity.tenantId === row.tenant_id);
    if (!tenant) {
      skipped += 1;
      await markEmailSend(options.supabase, row.id, "failed", "Unknown tenant for email send");
      continue;
    }

    const isSuppressed = await isEmailSuppressed(options.supabase, row.tenant_id, row.recipient_email);
    if (isSuppressed) {
      skipped += 1;
      await markEmailSend(options.supabase, row.id, "suppressed", "Recipient is suppressed");
      continue;
    }

    const lead = await getLeadEmailContext(options.supabase, row.lead_id);
    const unsubscribeUrl = buildUnsubscribeUrl(options.appUrl, tenant, row.recipient_email);
    const html = renderEmailHtml(row.template, tenant, lead, unsubscribeUrl, options.appUrl);
    const result = await sendWithResend({
      apiKey: options.resendApiKey,
      from: `${tenant.email.fromName} <${tenant.email.fromAddress}>`,
      to: row.recipient_email,
      subject: row.subject,
      html
    });

    if (result.status === "sent") {
      sent += 1;
      await options.supabase
        .from("email_sends")
        .update({ status: "sent", sent_at: new Date().toISOString(), provider_message_id: result.id })
        .eq("id", row.id);
      await recordEmailEvent(options.supabase, {
        tenantId: row.tenant_id,
        leadId: row.lead_id,
        eventType: "email.sent",
        metadata: {
          emailSendId: row.id,
          sequenceId: row.sequence_id,
          providerMessageId: result.id,
          recipientEmail: row.recipient_email
        }
      });
    } else {
      skipped += 1;
      await markEmailSend(options.supabase, row.id, "skipped", result.reason);
    }
  }

  return {
    processed: data.length,
    sent,
    skipped
  };
}

async function getLeadEmailContext(supabase: SupabaseClient, leadId: string): Promise<LeadEmailContext> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, email, score, data")
    .eq("id", leadId)
    .single<{ id: string; email: string | null; score: number; data: Record<string, unknown> }>();

  if (error) {
    throw new Error(`Lead email context query failed: ${error.message}`);
  }

  return {
    id: data.id,
    email: data.email ?? "",
    score: data.score,
    data: data.data
  };
}

async function isEmailSuppressed(supabase: SupabaseClient, tenantId: string, email: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("email_suppressions")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("email", email)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Suppression query failed: ${error.message}`);
  }

  return Boolean(data);
}

async function markEmailSend(supabase: SupabaseClient, id: string, status: string, error: string) {
  await supabase.from("email_sends").update({ status, error }).eq("id", id);
}

async function sendWithResend(options: {
  apiKey: string | undefined;
  from: string;
  to: string;
  subject: string;
  html: string;
}): Promise<{ status: "sent"; id: string | null } | { status: "skipped"; reason: string }> {
  if (!options.apiKey) {
    return { status: "skipped", reason: "RESEND_API_KEY is not configured" };
  }

  const response = await retryFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${options.apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: options.from,
      to: options.to,
      subject: options.subject,
      html: options.html
    })
  });

  if (!response.ok) {
    return { status: "skipped", reason: `Resend send failed with ${String(response.status)}` };
  }

  const body = (await response.json()) as ResendResult;
  return { status: "sent", id: body.id ?? null };
}

export async function suppressEmail(options: {
  supabase: SupabaseClient;
  tenantId: string;
  email: string;
  reason: string;
  source: string;
}) {
  const { error } = await options.supabase.from("email_suppressions").upsert(
    {
      tenant_id: options.tenantId,
      email: options.email,
      reason: options.reason,
      source: options.source
    },
    { onConflict: "tenant_id,email" }
  );

  if (error) {
    throw new Error(`Email suppression failed: ${error.message}`);
  }
}

export async function handleResendWebhook(options: {
  supabase: SupabaseClient;
  tenantSlug: string;
  eventType: string;
  messageId: string;
  recipientEmail: string;
  metadata?: Record<string, unknown>;
}) {
  const tenant = getTenantConfig(options.tenantSlug);
  const timestamp = new Date().toISOString();
  const update =
    options.eventType === "email.opened"
      ? { opened_at: timestamp }
      : options.eventType === "email.clicked"
        ? { clicked_at: timestamp }
        : options.eventType === "email.bounced"
          ? { bounced_at: timestamp, status: "bounced" }
          : {};

  const { data: emailSend } = await options.supabase
    .from("email_sends")
    .select("id, tenant_id, lead_id, sequence_id")
    .eq("provider_message_id", options.messageId)
    .maybeSingle<{ id: string; tenant_id: string; lead_id: string; sequence_id: string }>();

  if (Object.keys(update).length > 0) {
    await options.supabase.from("email_sends").update(update).eq("provider_message_id", options.messageId);
  }

  if (emailSend && (options.eventType === "email.opened" || options.eventType === "email.clicked")) {
    await recordEmailEvent(options.supabase, {
      tenantId: emailSend.tenant_id,
      leadId: emailSend.lead_id,
      eventType: options.eventType,
      metadata: {
        emailSendId: emailSend.id,
        sequenceId: emailSend.sequence_id,
        providerMessageId: options.messageId,
        recipientEmail: options.recipientEmail,
        ...options.metadata
      }
    });
  }

  if (options.eventType === "email.bounced") {
    await suppressEmail({
      supabase: options.supabase,
      tenantId: tenant.identity.tenantId,
      email: options.recipientEmail,
      reason: "bounce",
      source: "resend-webhook"
    });
  }
}

async function recordEmailEvent(
  supabase: SupabaseClient,
  event: {
    tenantId: string;
    leadId: string;
    eventType: string;
    metadata: Record<string, unknown>;
  }
) {
  const { error } = await supabase.from("events").insert({
    tenant_id: event.tenantId,
    lead_id: event.leadId,
    event_type: event.eventType,
    metadata: event.metadata
  });

  if (error) {
    throw new Error(`Email event insert failed: ${error.message}`);
  }
}
