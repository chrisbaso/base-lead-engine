import type { TenantConfigInput } from "@ble/tenant-schema";

export const demoSequences = [
  {
    id: "demo-01",
    subject: "Your lead funnel plan is ready",
    delayHours: 0,
    template: "demoWelcome",
    condition: "always"
  },
  {
    id: "demo-02",
    subject: "The fastest way to launch the first funnel",
    delayHours: 24,
    template: "demoLaunchPlan",
    condition: "always"
  },
  {
    id: "demo-03",
    subject: "How to decide between quiz, calculator, and form",
    delayHours: 48,
    template: "demoFunnelTypes",
    condition: "always"
  },
  {
    id: "demo-04",
    subject: "What to connect after the first lead arrives",
    delayHours: 72,
    template: "demoAutomation",
    condition: "qualified"
  },
  {
    id: "demo-05",
    subject: "Your reusable launch checklist",
    delayHours: 120,
    template: "demoChecklist",
    condition: "always"
  }
] satisfies TenantConfigInput["email"]["sequences"];
