import type { TenantConfigInput } from "@ble/tenant-schema";
import { hvacFirstEmailVariations, hvacNurtureTemplates } from "./copy";

export const hvacOpsProSequences = [
  {
    id: "hvac-01-recommendation",
    subject: hvacFirstEmailVariations[0].subject,
    delayHours: 0,
    template: hvacFirstEmailVariations[0].template,
    condition: "always"
  },
  {
    id: "hvac-02-scheduling-mistakes",
    subject: "3 things HVAC owners get wrong about scheduling software",
    delayHours: 48,
    template: hvacNurtureTemplates.schedulingMistakes,
    condition: "always"
  },
  {
    id: "hvac-03-dallas-case-study",
    subject: "How an 8-truck HVAC shop cleaned up the handoff",
    delayHours: 72,
    template: hvacNurtureTemplates.dallasCaseStudy,
    condition: "always"
  },
  {
    id: "hvac-04-objections",
    subject: "Cost, training, and the pain of switching",
    delayHours: 96,
    template: hvacNurtureTemplates.objections,
    condition: "always"
  },
  {
    id: "hvac-05-final-nudge",
    subject: "One last nudge on your HVAC software pick",
    delayHours: 120,
    template: hvacNurtureTemplates.finalNudge,
    condition: "always"
  }
] satisfies TenantConfigInput["email"]["sequences"];
