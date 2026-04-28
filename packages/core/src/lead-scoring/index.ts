import type { TenantConfig } from "@ble/tenant-schema";

export type ScoreResult = {
  score: number;
  reasons: string[];
  qualified: boolean;
};

type FieldValue = string | number | boolean | undefined;

export function computeLeadScore(tenant: TenantConfig, fields: Record<string, unknown>): ScoreResult {
  const reasons: string[] = [];
  let score = 0;

  for (const rule of tenant.scoring.rules) {
    const fieldValue = normalizeFieldValue(fields[rule.field]);
    if (matchesRule(fieldValue, rule.operator, rule.value)) {
      score += rule.points;
      if (rule.reason) {
        reasons.push(rule.reason);
      }
    }
  }

  return {
    score,
    reasons,
    qualified: score >= tenant.scoring.qualifiedThreshold
  };
}

function normalizeFieldValue(value: unknown): FieldValue {
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  return undefined;
}

function matchesRule(
  fieldValue: FieldValue,
  operator: "equals" | "notEquals" | "contains" | "greaterThan" | "lessThan",
  ruleValue: string | number | boolean
): boolean {
  if (operator === "equals") {
    return fieldValue === ruleValue;
  }

  if (operator === "notEquals") {
    return fieldValue !== ruleValue;
  }

  if (operator === "contains") {
    return typeof fieldValue === "string" && typeof ruleValue === "string" && fieldValue.includes(ruleValue);
  }

  if (operator === "greaterThan") {
    return Number(fieldValue) > Number(ruleValue);
  }

  return Number(fieldValue) < Number(ruleValue);
}
