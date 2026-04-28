import type { TenantConfigInput } from "@ble/tenant-schema";

export const retirementLeadCapture = {
  type: "calculator",
  headline: "Estimate Your Retirement Paycheck in 30 Seconds",
  subheadline:
    "Enter four quick numbers to see how much monthly income your retirement savings could potentially produce.",
  steps: [
    {
      id: "quick-numbers",
      title: "Your Quick Numbers",
      description: "Your savings figure is used only to generate an illustrative income range.",
      fields: [
        {
          id: "age",
          label: "Current Age",
          type: "number",
          required: true
        },
        {
          id: "state",
          label: "State",
          type: "select",
          required: true,
          options: [
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
          ]
        },
        {
          id: "retirementSavings",
          label: "Estimated Retirement Savings ($)",
          type: "number",
          required: true
        },
        {
          id: "retirementAge",
          label: "Target Retirement Age",
          type: "number",
          required: true
        }
      ]
    },
    {
      id: "unlock-estimate",
      title: "Your Retirement Income Estimate Is Ready",
      description: "Enter your details below to unlock your personalized monthly income range.",
      fields: [
        {
          id: "firstName",
          label: "First Name",
          type: "text",
          required: true
        },
        {
          id: "email",
          label: "Email Address",
          type: "email",
          required: true,
          capturePartial: true
        },
        {
          id: "phone",
          label: "Phone Number",
          type: "tel",
          required: false
        }
      ]
    },
    {
      id: "refine-profile",
      title: "Want a more personalized assessment?",
      description: "Answer 4 quick questions to refine your profile and score.",
      fields: [
        {
          id: "maritalStatus",
          label: "Marital Status",
          type: "select",
          required: true,
          options: ["single", "married"]
        },
        {
          id: "retirementStatus",
          label: "Retirement Status",
          type: "select",
          required: true,
          options: ["working", "retiring_in_1_3_years", "retiring_within_1_year", "already_retired"]
        },
        {
          id: "primaryConcern",
          label: "Biggest Concern",
          type: "select",
          required: true,
          options: ["market_volatility", "outliving_savings", "income_stability", "taxes", "unsure"]
        },
        {
          id: "incomePreference",
          label: "Income Priority",
          type: "select",
          required: true,
          options: ["guaranteed", "growth", "balanced", "unsure"]
        }
      ]
    }
  ]
} satisfies TenantConfigInput["leadCapture"];
