import type { TenantConfigInput } from "@ble/tenant-schema";

export const smartRetirementScoring = {
  rules: [
    { field: "currentAge", operator: "greaterThan", value: 54, points: 15, reason: "Peak retirement-planning audience" },
    { field: "currentAge", operator: "lessThan", value: 71, points: 15, reason: "Peak retirement-planning audience" },
    { field: "retirementSavings", operator: "greaterThan", value: 249999, points: 25, reason: "Advisable account size" },
    { field: "retirementSavings", operator: "greaterThan", value: 999999, points: 20, reason: "High-value lead" },
    { field: "primaryConcern", operator: "equals", value: "outliving_savings", points: 20, reason: "Matches firm specialty" },
    { field: "primaryConcern", operator: "equals", value: "income_stability", points: 15, reason: "Income stability concern" },
    { field: "retirementStatus", operator: "equals", value: "retiring_within_1_year", points: 25, reason: "High intent" },
    { field: "retirementStatus", operator: "equals", value: "already_retired", points: 25, reason: "High intent" },
    { field: "incomePreference", operator: "equals", value: "guaranteed", points: 15, reason: "Guaranteed income fit" },
    { field: "state", operator: "equals", value: "MN", points: 10, reason: "Servable state" },
    { field: "state", operator: "equals", value: "WI", points: 10, reason: "Servable state" },
    { field: "state", operator: "equals", value: "ND", points: 10, reason: "Servable state" },
    { field: "state", operator: "equals", value: "SD", points: 10, reason: "Servable state" },
    { field: "phone", operator: "contains", value: "", points: 10, reason: "Phone provided" }
  ],
  qualifiedThreshold: 60
} satisfies TenantConfigInput["scoring"];
