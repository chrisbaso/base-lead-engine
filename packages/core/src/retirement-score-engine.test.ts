import { describe, expect, it } from "vitest";
import { calculateRetirementIncomeScore } from "@ble/tenant-retire-ready-mn/lib/retirement-score-engine";

describe("calculateRetirementIncomeScore", () => {
  it("returns a green score when projected income fully covers desired income", () => {
    const result = calculateRetirementIncomeScore({
      currentAge: 60,
      targetRetirementAge: 67,
      currentSavingsBucket: "1000000-2000000",
      monthlySocialSecurity: 3200,
      desiredMonthlyIncome: 7000,
      primaryConcern: "taxes"
    });

    expect(result.score).toBe(88);
    expect(result.band).toBe("Green");
    expect(result.summary).toContain("on track");
    expect(result.projectedMonthlyPortfolioIncome).toBe(5000);
    expect(result.projectedMonthlyIncome).toBe(8200);
  });

  it("returns a yellow score for a partial income gap", () => {
    const result = calculateRetirementIncomeScore({
      currentAge: 58,
      targetRetirementAge: 67,
      currentSavingsBucket: "500000-1000000",
      monthlySocialSecurity: 2500,
      desiredMonthlyIncome: 6200,
      primaryConcern: "market_crash"
    });

    expect(result.score).toBe(73);
    expect(result.band).toBe("Yellow");
    expect(result.summary).toContain("modest gap");
  });

  it("returns a red score for a large income gap", () => {
    const result = calculateRetirementIncomeScore({
      currentAge: 55,
      targetRetirementAge: 65,
      currentSavingsBucket: "under-250000",
      monthlySocialSecurity: 1800,
      desiredMonthlyIncome: 6500,
      primaryConcern: "outliving_savings"
    });

    expect(result.score).toBe(36);
    expect(result.band).toBe("Red");
    expect(result.summary).toContain("meaningful gap");
  });
});
