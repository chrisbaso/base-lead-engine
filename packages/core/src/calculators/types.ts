export type FormulaId = "retirementIncome";

export type CalculatorInputs = Record<string, number | string>;

export type ProjectionPoint = {
  age: number;
  valueLow: number;
  valueHigh: number;
};

export type CalculatorResult = {
  primary: number;
  primaryRange: { low: number; high: number };
  monthly: { low: number; high: number };
  annual: { low: number; high: number };
  projection: ProjectionPoint[];
  assumptions: {
    lowPayoutRate: number;
    highPayoutRate: number;
    rateBasis: "fixedIncomePayoutRates";
  };
};

export type ComputeFn = (inputs: CalculatorInputs) => CalculatorResult;
