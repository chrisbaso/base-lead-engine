import type { TenantConfigInput } from "@ble/tenant-schema";

export const retireReadyMnScoring = {
  rules: [
    { field: "annuityIntentScore", operator: "greaterThan", value: 69, points: 50, reason: "High income-floor intent" },
    { field: "annuityIntentScore", operator: "greaterThan", value: 44, points: 25, reason: "Medium income-floor intent" },
    { field: "currentSavings", operator: "greaterThan", value: 499999, points: 15, reason: "Meaningful planning assets" },
    { field: "monthlyIncomeGap", operator: "greaterThan", value: 499, points: 10, reason: "Monthly income gap to review" },
    { field: "incomePreference", operator: "equals", value: "dependable_income", points: 15, reason: "Dependable income preference" },
    { field: "tcpaConsent", operator: "equals", value: true, points: 10, reason: "Consent captured" },
    { field: "primaryConcern", operator: "equals", value: "outliving_savings", points: 10, reason: "Longevity planning concern" }
  ],
  qualifiedThreshold: 70
} satisfies TenantConfigInput["scoring"];
