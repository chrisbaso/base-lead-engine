import type { TenantConfigInput } from "@ble/tenant-schema";

export const retireReadyMnScoring = {
  rules: [
    { field: "retirementScore", operator: "greaterThan", value: 75, points: 40, reason: "Green retirement income score" },
    { field: "retirementScore", operator: "greaterThan", value: 50, points: 25, reason: "Yellow retirement income score" },
    { field: "currentSavings", operator: "greaterThan", value: 499999, points: 20, reason: "Meaningful planning assets" },
    { field: "phone", operator: "contains", value: "", points: 15, reason: "Phone provided for handoff" },
    { field: "tcpaConsent", operator: "equals", value: true, points: 10, reason: "Consent captured" },
    { field: "primaryConcern", operator: "equals", value: "outliving_savings", points: 10, reason: "Income planning concern" },
    { field: "primaryConcern", operator: "equals", value: "taxes", points: 10, reason: "Tax planning concern" }
  ],
  qualifiedThreshold: 60
} satisfies TenantConfigInput["scoring"];
