import type { TenantConfigInput } from "@ble/tenant-schema";

export const hvacOpsProScoring = {
  rules: [
    { field: "teamSize", operator: "equals", value: "6-15", points: 25, reason: "Established field team" },
    { field: "teamSize", operator: "equals", value: "16+", points: 35, reason: "Larger HVAC operation" },
    { field: "biggestHeadache", operator: "equals", value: "dispatching", points: 25, reason: "Dispatch pain indicates high software intent" },
    { field: "biggestHeadache", operator: "equals", value: "scheduling", points: 20, reason: "Scheduling pain indicates high software intent" },
    { field: "monthlyRevenueRange", operator: "equals", value: "$100k-$250k", points: 20, reason: "Revenue supports paid ops tooling" },
    { field: "monthlyRevenueRange", operator: "equals", value: "$250k+", points: 30, reason: "High-volume shop" },
    { field: "usingSoftware", operator: "equals", value: "yes", points: 10, reason: "Already understands software workflow" },
    { field: "email", operator: "contains", value: "@", points: 10, reason: "Email captured" }
  ],
  qualifiedThreshold: 60
} satisfies TenantConfigInput["scoring"];
