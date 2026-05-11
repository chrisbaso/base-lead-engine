import type { CalculatorResult } from "@ble/core/calculators";

export type CalculatorInputs = {
  currentAge: number;
  retirementAge: number;
  retirementSavings: number;
  state: string;
};

export type CalculatorLeadInfo = {
  firstName: string;
  email: string;
  phone?: string;
};

export type CalculatorRefineInfo = {
  maritalStatus: "" | "single" | "married";
  retirementStatus: "" | "working" | "retiring_within_1_year" | "retiring_in_1_3_years" | "already_retired";
  primaryConcern: "" | "market_volatility" | "outliving_savings" | "income_stability" | "taxes" | "unsure";
  incomePreference: "" | "guaranteed" | "growth" | "balanced" | "unsure";
};

export type CalculatorTier = "low" | "medium" | "high";

export type CalculatorStore = {
  inputs: CalculatorInputs;
  leadInfo: CalculatorLeadInfo;
  refineInfo: CalculatorRefineInfo;
  score: number;
  tier: CalculatorTier;
  computedResult: CalculatorResult | null;
  leadId: string | null;
  isUnlocked: boolean;
};

export const defaultCalculatorInputs: CalculatorInputs = {
  currentAge: 60,
  retirementAge: 67,
  retirementSavings: 750000,
  state: "MN"
};

export const defaultCalculatorStore: CalculatorStore = {
  inputs: defaultCalculatorInputs,
  leadInfo: {
    firstName: "",
    email: ""
  },
  refineInfo: {
    maritalStatus: "",
    retirementStatus: "",
    primaryConcern: "",
    incomePreference: ""
  },
  score: 0,
  tier: "medium",
  computedResult: null,
  leadId: null,
  isUnlocked: false
};

export function getCalculatorStorageKey(slug: string): string {
  return `ble:${slug}:calc`;
}
