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
          required: true,
          helperText: "Ages 50–80",
          validation: {
            min: 50,
            max: 80,
            message: "Age must be between 50 and 80"
          }
        },
        {
          id: "state",
          label: "State",
          type: "select",
          required: true,
          validation: {
            minLength: 2,
            maxLength: 2,
            message: "Please select your state"
          },
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
          required: true,
          helperText: "Include 401(k), IRA, and other accounts",
          validation: {
            min: 1,
            max: 50_000_000,
            message: "Please enter valid retirement savings"
          }
        },
        {
          id: "retirementAge",
          label: "Target Retirement Age",
          type: "number",
          required: true,
          helperText: "When you plan to start drawing income",
          validation: {
            min: 55,
            max: 90,
            message: "Retirement age must be between 55 and 90"
          }
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
          required: true,
          validation: {
            minLength: 1,
            maxLength: 50,
            message: "Please enter your first name"
          }
        },
        {
          id: "email",
          label: "Email Address",
          type: "email",
          required: true,
          helperText: "We'll send a copy of your income snapshot to this address.",
          validation: {
            message: "Please enter a valid email address"
          },
          capturePartial: true
        },
        {
          id: "phone",
          label: "Phone Number",
          type: "tel",
          required: false,
          helperText: "Optional — only if you'd like a personalized review call."
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
