import type { TenantConfig } from "@ble/tenant-schema";
import type { LeadEmailContext } from "./index";

type TemplateProps = {
  template: string;
  tenant: TenantConfig;
  lead: LeadEmailContext;
  unsubscribeUrl: string;
  appUrl?: string | undefined;
};

const templateBody: Record<string, string[]> = {
  demoWelcome: [
    "Thanks for trying the demo funnel. Your answers are saved and ready for the automation pipeline.",
    "The next step is connecting the offer, tracking, CRM, and email sequence behind one tenant config."
  ],
  demoLaunchPlan: [
    "Start with the smallest funnel that can prove demand: one offer, one source, one conversion event.",
    "Once leads are flowing, the same chassis can add qualification, routing, and nurture without rebuilding the app."
  ],
  demoFunnelTypes: [
    "Use a quiz when the buyer needs guided diagnosis, a calculator when the value is numerical, and a lead form when intent is already high.",
    "The platform keeps all three as config-driven primitives."
  ],
  demoAutomation: [
    "Qualified leads should move quickly: server-side tracking, CRM creation, owner notification, and the right first email.",
    "Lower-intent leads can stay in nurture until their behavior or answers change."
  ],
  demoChecklist: [
    "For the next tenant, configure branding, domains, lead steps, scoring, tracking IDs, CRM mappings, and email sequences.",
    "The north star is still under four hours from idea to live funnel."
  ]
};

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function renderDemoEmailHtml(props: TemplateProps): string {
  const context = buildTemplateContext(props);
  const body = templateBody[props.template];
  const company = typeof props.lead.data.company === "string" ? props.lead.data.company : "your business";
  const title = body ? `Your plan for ${company}` : props.tenant.identity.name;
  const paragraphs = body ? renderParagraphs(body) : renderTemplateString(props.template, context);

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f8fb;color:#172033;font-family:Arial,sans-serif">
    <main style="margin:0 auto;max-width:640px;padding:32px">
      <p style="color:${escapeHtml(props.tenant.branding.primaryColor)};font-weight:700">${escapeHtml(props.tenant.email.fromName)}</p>
      <h1 style="font-size:28px;line-height:1.2">${escapeHtml(title)}</h1>
      ${paragraphs}
      <p style="font-size:14px;line-height:1.5;color:#5c6a7d">You are receiving this because you requested information from ${escapeHtml(props.tenant.identity.name)}.</p>
      <p><a href="${escapeHtml(props.unsubscribeUrl)}">Unsubscribe</a></p>
    </main>
  </body>
</html>`;
}

function renderParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map((paragraph) => `<p style="font-size:16px;line-height:1.6">${escapeHtml(paragraph)}</p>`)
    .join("");
}

function renderTemplateString(template: string, context: Record<string, string>): string {
  const interpolated = template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, key: string) => context[key] ?? "");
  return interpolated
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const html = escapeHtml(paragraph).replaceAll("\n", "<br />");
      return `<p style="font-size:16px;line-height:1.6">${linkifyAffiliateUrl(html, context.affiliateUrl ?? "")}</p>`;
    })
    .join("");
}

function buildTemplateContext(props: TemplateProps): Record<string, string> {
  const leadData = Object.fromEntries(
    Object.entries(props.lead.data)
      .filter((entry): entry is [string, string | number | boolean] =>
        typeof entry[1] === "string" || typeof entry[1] === "number" || typeof entry[1] === "boolean"
      )
      .map(([key, value]) => [key, String(value)])
  );
  const platformId = leadData.recommendedPlatformId;
  const affiliateUrl =
    props.appUrl && platformId
      ? buildAffiliateClickUrl({
          appUrl: props.appUrl,
          tenantSlug: props.tenant.identity.slug,
          leadId: props.lead.id,
          platformId,
          ...(leadData.quizVariant ? { quizVariant: leadData.quizVariant } : {}),
          ...(leadData.emailVariant ? { emailVariant: leadData.emailVariant } : {})
        })
      : "";

  return {
    ...leadData,
    firstName: leadData.firstName || "there",
    recommendedSoftware: leadData.recommendedSoftware || "the recommended platform",
    recommendationReason: leadData.recommendationReason || "it best matches the way your team works today",
    affiliateUrl,
    unsubscribeUrl: props.unsubscribeUrl,
    tenantName: props.tenant.identity.name
  };
}

function buildAffiliateClickUrl({
  appUrl,
  tenantSlug,
  leadId,
  platformId,
  quizVariant,
  emailVariant
}: {
  appUrl: string;
  tenantSlug: string;
  leadId: string;
  platformId: string;
  quizVariant?: string;
  emailVariant?: string;
}): string {
  const url = new URL(`/api/affiliate/${platformId}`, appUrl);
  url.searchParams.set("tenant", tenantSlug);
  url.searchParams.set("lead_id", leadId);
  if (quizVariant) {
    url.searchParams.set("quiz_variant", quizVariant);
  }
  if (emailVariant) {
    url.searchParams.set("email_variant", emailVariant);
  }
  return url.toString();
}

function linkifyAffiliateUrl(html: string, affiliateUrl: string): string {
  if (!affiliateUrl) {
    return html;
  }

  const escapedUrl = escapeHtml(affiliateUrl);
  return html.replaceAll(escapedUrl, `<a href="${escapedUrl}">${escapedUrl}</a>`);
}
