import type { CalculatorInputs, CalculatorResult, ProjectionPoint } from "./types";

const PROJECTION_YEARS = 30;

export class CalculatorInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CalculatorInputError";
  }
}

function readNumber(inputs: CalculatorInputs, key: string, fallbackKey?: string): number {
  const value = inputs[key] ?? (fallbackKey ? inputs[fallbackKey] : undefined);
  const parsed = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(parsed)) {
    throw new CalculatorInputError(`${key} must be a number.`);
  }

  return parsed;
}

function assertRange(value: number, min: number, max: number, label: string) {
  if (value < min || value > max) {
    throw new CalculatorInputError(`${label} must be between ${String(min)} and ${String(max)}.`);
  }
}

export function retirementIncome(inputs: CalculatorInputs): CalculatorResult {
  const currentAge = readNumber(inputs, "currentAge", "age");
  const retirementAge = readNumber(inputs, "retirementAge");
  const retirementSavings = readNumber(inputs, "retirementSavings");

  assertRange(currentAge, 50, 80, "Current age");
  assertRange(retirementAge, 55, 90, "Retirement age");

  if (retirementAge <= currentAge) {
    throw new CalculatorInputError("Retirement age must be greater than current age.");
  }

  assertRange(retirementSavings, 1, 50000000, "Retirement savings");

  let lowPayoutRate = 0.048;
  let highPayoutRate = 0.054;

  if (retirementAge >= 70) {
    lowPayoutRate = 0.064;
    highPayoutRate = 0.072;
  } else if (retirementAge >= 65) {
    lowPayoutRate = 0.058;
    highPayoutRate = 0.066;
  } else if (retirementAge >= 60) {
    lowPayoutRate = 0.052;
    highPayoutRate = 0.059;
  }

  const annualLow = Math.round(retirementSavings * lowPayoutRate);
  const annualHigh = Math.round(retirementSavings * highPayoutRate);
  const monthlyLow = Math.round(annualLow / 12);
  const monthlyHigh = Math.round(annualHigh / 12);
  const projection: ProjectionPoint[] = [];

  for (let offset = 0; offset <= PROJECTION_YEARS; offset += 1) {
    projection.push({
      age: retirementAge + offset,
      valueLow: annualLow,
      valueHigh: annualHigh
    });
  }

  return {
    primary: monthlyHigh,
    primaryRange: { low: monthlyLow, high: monthlyHigh },
    monthly: { low: monthlyLow, high: monthlyHigh },
    annual: { low: annualLow, high: annualHigh },
    projection,
    assumptions: {
      lowPayoutRate,
      highPayoutRate,
      rateBasis: "fixedIncomePayoutRates"
    }
  };
}
