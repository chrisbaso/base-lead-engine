import type { TenantConfigInput } from "@ble/tenant-schema";

export const retireReadyMnLeadCapture = {
  type: "calculator",
  headline: "Minnesota's Retirement Income Checkup",
  subheadline: "See your retirement income score in two minutes. Free, private, built for Minnesotans.",
  steps: [
    {
      id: "age",
      title: "Retirement timeline",
      fields: [
        { id: "currentAge", label: "Current age", type: "number", required: true, validation: { min: 45, max: 85 } },
        {
          id: "targetRetirementAge",
          label: "Target retirement age",
          type: "number",
          required: true,
          validation: { min: 55, max: 75 }
        }
      ]
    },
    {
      id: "savings",
      title: "Current retirement savings",
      fields: [
        {
          id: "currentSavingsBucket",
          label: "Current retirement savings",
          type: "select",
          required: true,
          options: ["under-250000", "250000-500000", "500000-1000000", "1000000-2000000", "over-2000000"]
        }
      ]
    },
    {
      id: "social-security",
      title: "Social Security estimate",
      fields: [
        {
          id: "monthlySocialSecurity",
          label: "Estimated monthly Social Security benefit at full retirement age",
          type: "number",
          required: true,
          validation: { min: 0, max: 8000 }
        }
      ]
    },
    {
      id: "desired-income",
      title: "Desired income",
      fields: [
        {
          id: "desiredMonthlyIncome",
          label: "Desired monthly retirement income in today's dollars",
          type: "number",
          required: true,
          validation: { min: 1000, max: 50000 }
        }
      ]
    },
    {
      id: "primary-concern",
      title: "Primary retirement concern",
      fields: [
        {
          id: "primaryConcern",
          label: "Primary concern",
          type: "select",
          required: true,
          options: ["outliving_savings", "market_crash", "taxes", "leaving_legacy", "healthcare_costs"]
        }
      ]
    },
    {
      id: "income-preference",
      title: "Income planning preference",
      fields: [
        {
          id: "incomePreference",
          label: "Planning question",
          type: "select",
          required: true,
          options: [
            "dependable_income",
            "growth_flexibility",
            "tax_efficiency",
            "legacy_flexibility",
            "not_sure"
          ]
        }
      ]
    },
    {
      id: "email-gate",
      title: "See your full score",
      fields: [
        { id: "firstName", label: "First name", type: "text", required: true, validation: { maxLength: 50 } },
        { id: "email", label: "Email", type: "email", required: true, capturePartial: true }
      ]
    },
    {
      id: "phone-match",
      title: "Get matched locally",
      fields: [
        { id: "lastName", label: "Last name", type: "text", required: true, validation: { maxLength: 50 } },
        { id: "phone", label: "Phone", type: "tel", required: true },
        { id: "tcpaConsent", label: "TCPA consent", type: "checkbox", required: true }
      ]
    }
  ]
} satisfies TenantConfigInput["leadCapture"];
