import type { TenantConfigInput } from "@ble/tenant-schema";

export const usStateCodes = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY"
] as const;

export const smartRetirementLeadCapture = {
  type: "calculator",
  headline: "Will your savings actually pay you when you stop working?",
  subheadline:
    "See your estimated retirement paycheck in 30 seconds — and find out whether it's enough.",
  steps: [
    {
      id: "calculator-inputs",
      title: "Run your numbers",
      fields: [
        {
          id: "currentAge",
          label: "Current age",
          type: "number",
          required: true,
          helperText: "Ages 50–80",
          validation: { min: 50, max: 80 }
        },
        {
          id: "retirementAge",
          label: "Target retirement age",
          type: "number",
          required: true,
          helperText: "When you plan to start drawing income",
          validation: { min: 55, max: 75 }
        },
        {
          id: "retirementSavings",
          label: "Retirement savings",
          type: "number",
          required: true,
          helperText: "401(k), IRA, brokerage — total liquid retirement assets",
          validation: { min: 1, max: 50000000 }
        },
        {
          id: "state",
          label: "State",
          type: "select",
          required: true,
          helperText: "We currently serve MN, WI, ND, and SD",
          options: [...usStateCodes]
        }
      ]
    },
    {
      id: "email-gate",
      title: "Your estimate is ready",
      fields: [
        { id: "firstName", label: "First name", type: "text", required: true, validation: { maxLength: 50 } },
        {
          id: "email",
          label: "Email",
          type: "email",
          required: true,
          capturePartial: true,
          helperText: "We'll send a copy of your estimate to this address."
        },
        {
          id: "phone",
          label: "Phone",
          type: "tel",
          required: false,
          helperText: "Optional — only if you'd like a personalized review call."
        }
      ]
    },
    {
      id: "refine",
      title: "Refine your profile",
      fields: [
        { id: "maritalStatus", label: "Marital status", type: "select", options: ["single", "married"] },
        {
          id: "retirementStatus",
          label: "Retirement status",
          type: "select",
          options: ["working", "retiring_in_1_3_years", "retiring_within_1_year", "already_retired"]
        },
        {
          id: "primaryConcern",
          label: "Primary concern",
          type: "select",
          options: ["market_volatility", "outliving_savings", "income_stability", "taxes", "unsure"]
        },
        {
          id: "incomePreference",
          label: "Income preference",
          type: "select",
          options: ["guaranteed", "growth", "balanced", "unsure"]
        }
      ]
    }
  ]
} satisfies TenantConfigInput["leadCapture"];
