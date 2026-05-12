import type { TenantConfigInput } from "@ble/tenant-schema";
import { hvacQuizCopyVariations } from "./copy";

const defaultCopy = hvacQuizCopyVariations[0];

export const hvacOpsProLeadCapture = {
  type: "quiz",
  headline: defaultCopy.headline,
  subheadline: defaultCopy.subheadline,
  steps: [
    {
      id: "team-size",
      title: "How many people are on your HVAC team?",
      fields: [
        {
          id: "teamSize",
          label: "Team size",
          type: "select",
          required: true,
          options: ["1", "2-5", "6-15", "16+"]
        }
      ]
    },
    {
      id: "daily-headache",
      title: "What is the biggest daily headache?",
      fields: [
        {
          id: "biggestHeadache",
          label: "Biggest headache",
          type: "select",
          required: true,
          options: ["scheduling", "customer follow-up", "invoicing", "dispatching"]
        }
      ]
    },
    {
      id: "current-software",
      title: "Are you using software today?",
      fields: [
        {
          id: "usingSoftware",
          label: "Currently using software?",
          type: "select",
          required: true,
          options: ["yes", "no"]
        },
        {
          id: "currentSoftware",
          label: "Which one?",
          type: "text",
          required: false,
          helperText: "If you said yes, name the platform."
        }
      ]
    },
    {
      id: "monthly-revenue",
      title: "What is your average monthly revenue?",
      fields: [
        {
          id: "monthlyRevenueRange",
          label: "Monthly revenue",
          type: "select",
          required: true,
          options: ["Under $50k", "$50k-$100k", "$100k-$250k", "$250k+"]
        }
      ]
    },
    {
      id: "contact",
      title: "Where should we send the recommendation?",
      fields: [
        {
          id: "firstName",
          label: "First name",
          type: "text",
          required: true,
          validation: { maxLength: 50 }
        },
        {
          id: "email",
          label: "Email",
          type: "email",
          required: true,
          capturePartial: true,
          helperText: "We will send your recommendation and the link."
        }
      ]
    }
  ]
} satisfies TenantConfigInput["leadCapture"];
