import type { TenantConfig } from "@ble/tenant-schema";
import { retryFetch } from "../retry";

export type LeadNotification = {
  leadId: string;
  email: string | null;
  score: number;
  reasons: string[];
};

export async function sendHighScoreNotification(options: {
  tenant: TenantConfig;
  notification: LeadNotification;
  resendApiKey: string | undefined;
}): Promise<"sent" | "skipped"> {
  const slackSent = await sendSlackNotification(options.tenant, options.notification);
  const emailSent = await sendEmailNotification(options.tenant, options.notification, options.resendApiKey);
  return slackSent || emailSent ? "sent" : "skipped";
}

async function sendSlackNotification(tenant: TenantConfig, notification: LeadNotification): Promise<boolean> {
  if (!tenant.notifications.slackWebhookUrl) {
    return false;
  }

  const response = await retryFetch(tenant.notifications.slackWebhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      text: `${tenant.identity.name} qualified lead: ${notification.email ?? notification.leadId} scored ${String(notification.score)}`
    })
  });

  return response.ok;
}

async function sendEmailNotification(
  tenant: TenantConfig,
  notification: LeadNotification,
  resendApiKey: string | undefined
): Promise<boolean> {
  const fromAddress = tenant.notifications.fromAddress ?? tenant.email.fromAddress;

  if (!resendApiKey) {
    return false;
  }

  const response = await retryFetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      from: `${tenant.identity.name} <${fromAddress}>`,
      to: tenant.notifications.ownerEmail,
      subject: `Qualified lead: ${notification.email ?? notification.leadId}`,
      html: `<p>Lead scored ${String(notification.score)}.</p><p>${notification.reasons.join("<br />")}</p>`
    })
  });

  return response.ok;
}
