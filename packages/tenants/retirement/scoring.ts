import type { TenantConfigInput } from "@ble/tenant-schema";

export const AGE_LOW_TARGET = 55;
export const AGE_MID_TARGET = 60;
export const AGE_HIGH_TARGET = 65;
export const SAVINGS_ENTRY_THRESHOLD = 100_000;
export const SAVINGS_MID_THRESHOLD = 250_000;
export const SAVINGS_HIGH_THRESHOLD = 500_000;
export const SAVINGS_TOP_THRESHOLD = 1_000_000;
export const QUALIFIED_THRESHOLD = 8;

export const retirementScoring = {
  qualifiedThreshold: QUALIFIED_THRESHOLD,
  rules: [
    {
      field: "age",
      operator: "greaterThan",
      value: AGE_LOW_TARGET - 1,
      points: 1,
      reason: "Age is inside the early retirement-income planning window"
    },
    {
      field: "age",
      operator: "greaterThan",
      value: AGE_MID_TARGET - 1,
      points: 1,
      reason: "Age is inside the stronger FIA conversion planning window"
    },
    {
      field: "age",
      operator: "greaterThan",
      value: AGE_HIGH_TARGET - 1,
      points: 1,
      reason: "Age is at or above the high-priority payout window"
    },
    {
      field: "retirementSavings",
      operator: "greaterThan",
      value: SAVINGS_ENTRY_THRESHOLD - 1,
      points: 1,
      reason: "Retirement savings meet the entry threshold"
    },
    {
      field: "retirementSavings",
      operator: "greaterThan",
      value: SAVINGS_MID_THRESHOLD - 1,
      points: 1,
      reason: "Retirement savings meet the medium threshold"
    },
    {
      field: "retirementSavings",
      operator: "greaterThan",
      value: SAVINGS_HIGH_THRESHOLD - 1,
      points: 1,
      reason: "Retirement savings meet the high threshold"
    },
    {
      field: "retirementSavings",
      operator: "greaterThan",
      value: SAVINGS_TOP_THRESHOLD - 1,
      points: 1,
      reason: "Retirement savings meet the top threshold"
    },
    {
      field: "retirementStatus",
      operator: "equals",
      value: "already_retired",
      points: 3,
      reason: "Already retired and likely to need income planning now"
    },
    {
      field: "retirementStatus",
      operator: "equals",
      value: "retiring_within_1_year",
      points: 3,
      reason: "Retiring within one year and likely to need near-term income planning"
    },
    {
      field: "retirementStatus",
      operator: "equals",
      value: "retiring_in_1_3_years",
      points: 2,
      reason: "Retiring in one to three years"
    },
    {
      field: "primaryConcern",
      operator: "equals",
      value: "market_volatility",
      points: 2,
      reason: "Concerned about market volatility"
    },
    {
      field: "primaryConcern",
      operator: "equals",
      value: "outliving_savings",
      points: 2,
      reason: "Concerned about outliving savings"
    },
    {
      field: "primaryConcern",
      operator: "equals",
      value: "income_stability",
      points: 2,
      reason: "Interested in stable monthly income"
    },
    {
      field: "primaryConcern",
      operator: "equals",
      value: "taxes",
      points: 1,
      reason: "Interested in tax planning"
    },
    {
      field: "incomePreference",
      operator: "equals",
      value: "guaranteed",
      points: 2,
      reason: "Prefers predictable income"
    },
    {
      field: "incomePreference",
      operator: "equals",
      value: "balanced",
      points: 1,
      reason: "Prefers a balance of stability and growth"
    }
  ]
} satisfies TenantConfigInput["scoring"];
