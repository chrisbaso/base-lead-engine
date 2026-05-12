import { describe, expect, it } from "vitest";
import { compute } from "./index";
import { CalculatorInputError, retirementIncome } from "./retirementIncome";

describe("retirementIncome", () => {
  it("computes a typical retirement income range", () => {
    const result = retirementIncome({
      currentAge: 55,
      retirementAge: 65,
      retirementSavings: 500000
    });

    expect(result.annual.low).toBe(29000);
    expect(result.annual.high).toBe(33000);
    expect(result.monthly.low).toBe(2417);
    expect(result.monthly.high).toBe(2750);
    expect(result.primary).toBe(2750);
    expect(result.primaryRange.low).toBe(2417);
    expect(result.primaryRange.high).toBe(2750);
    expect(result.assumptions).toEqual({
      lowPayoutRate: 0.058,
      highPayoutRate: 0.066,
      rateBasis: "fixedIncomePayoutRates"
    });
  });

  it("computes the one-year edge case", () => {
    const result = retirementIncome({
      currentAge: 64,
      retirementAge: 65,
      retirementSavings: 1000000
    });

    expect(result.annual.low).toBe(58000);
    expect(result.annual.high).toBe(66000);
    expect(result.monthly.low).toBe(4833);
    expect(result.monthly.high).toBe(5500);
  });

  it("uses higher payout bands for retirement ages 70 and above", () => {
    const result = retirementIncome({
      currentAge: 60,
      retirementAge: 70,
      retirementSavings: 1000000
    });

    expect(result.annual.low).toBe(64000);
    expect(result.annual.high).toBe(72000);
    expect(result.monthly.low).toBe(5333);
    expect(result.monthly.high).toBe(6000);
  });

  it("builds a 31-point projection of the illustrated annual income band", () => {
    const result = retirementIncome({
      currentAge: 55,
      retirementAge: 65,
      retirementSavings: 500000
    });

    expect(result.projection).toHaveLength(31);
    expect(result.projection[0]).toEqual({ age: 65, valueLow: 29000, valueHigh: 33000 });
    expect(result.projection[30]).toEqual({ age: 95, valueLow: 29000, valueHigh: 33000 });
  });

  it("rejects invalid inputs with clear errors", () => {
    expect(() =>
      retirementIncome({ currentAge: 17, retirementAge: 65, retirementSavings: 500000 })
    ).toThrow(CalculatorInputError);
    expect(() =>
      retirementIncome({ currentAge: 65, retirementAge: 65, retirementSavings: 500000 })
    ).toThrow("Retirement age must be greater than current age.");
    expect(() =>
      retirementIncome({ currentAge: 55, retirementAge: 65, retirementSavings: 0 })
    ).toThrow("Retirement savings must be between 1 and 50000000.");
  });

  it("computes through the registry", () => {
    expect(
      compute("retirementIncome", {
        currentAge: 55,
        retirementAge: 65,
        retirementSavings: 500000
      }).monthly.low
    ).toBe(2417);
  });
});
