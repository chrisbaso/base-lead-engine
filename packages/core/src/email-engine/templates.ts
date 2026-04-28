import type { TenantConfig } from "@ble/tenant-schema";
import type { LeadEmailContext } from "./index";

type TemplateProps = {
  template: string;
  tenant: TenantConfig;
  lead: LeadEmailContext;
  unsubscribeUrl: string;
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
  const body = templateBody[props.template] ?? templateBody.demoWelcome ?? [];
  const company = typeof props.lead.data.company === "string" ? props.lead.data.company : "your business";
  const paragraphs = body
    .map((paragraph) => `<p style="font-size:16px;line-height:1.6">${escapeHtml(paragraph)}</p>`)
    .join("");

  return `<!doctype html>
<html>
  <body style="margin:0;background:#f6f8fb;color:#172033;font-family:Arial,sans-serif">
    <main style="margin:0 auto;max-width:640px;padding:32px">
      <p style="color:${escapeHtml(props.tenant.branding.primaryColor)};font-weight:700">${escapeHtml(props.tenant.email.fromName)}</p>
      <h1 style="font-size:28px;line-height:1.2">Your plan for ${escapeHtml(company)}</h1>
      ${paragraphs}
      <p style="font-size:14px;line-height:1.5;color:#5c6a7d">You are receiving this because you requested information from ${escapeHtml(props.tenant.identity.name)}.</p>
      <p><a href="${escapeHtml(props.unsubscribeUrl)}">Unsubscribe</a></p>
    </main>
  </body>
</html>`;
}
