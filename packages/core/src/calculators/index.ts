import { retirementIncome } from "./retirementIncome";
import type { CalculatorInputs, CalculatorResult, ComputeFn, FormulaId } from "./types";

export const calculators: Partial<Record<FormulaId, ComputeFn>> = {
  retirementIncome
};

export function compute(formulaId: FormulaId, inputs: CalculatorInputs): CalculatorResult {
  const fn = calculators[formulaId];

  if (!fn) {
    throw new Error(`Unknown formula: ${formulaId}`);
  }

  return fn(inputs);
}

export type { CalculatorInputs, CalculatorResult, ComputeFn, FormulaId, ProjectionPoint } from "./types";
export { CalculatorInputError, retirementIncome } from "./retirementIncome";
