import { describe, expect, it } from "vitest";
import { calculateAnnuityBuyerIntent } from "./annuity-intent-engine";

describe("calculateAnnuityBuyerIntent", () => {
  it("prioritizes high-asset households with income gap and dependable-income preference", () => {
    const result = calculateAnnuityBuyerIntent({
      currentAge: 62,
      targetRetirementAge: 67,
      currentSavingsBucket: "1000000-2000000",
      monthlySocialSecurity: 2800,
      desiredMonthlyIncome: 8500,
      primaryConcern: "outliving_savings",
      incomePreference: "dependable_income",
      phone: "6125550100",
      tcpaConsent: true,
      articleSlug: "annuities-without-the-sales-pitch"
    });

    expect(result.band).toBe("High");
    expect(result.segment).toBe("income_floor_ready");
    expect(result.reasons).toContain("Meaningful investable assets");
    expect(result.recommendedAction).toBe("priority_advisor_review");
  });

  it("keeps low-asset education-only visitors out of priority handoff", () => {
    const result = calculateAnnuityBuyerIntent({
      currentAge: 49,
      targetRetirementAge: 67,
      currentSavingsBucket: "under-250000",
      monthlySocialSecurity: 3200,
      desiredMonthlyIncome: 4200,
      primaryConcern: "leaving_legacy",
      incomePreference: "growth_flexibility",
      phone: "",
      tcpaConsent: false
    });

    expect(result.band).toBe("Low");
    expect(result.segment).toBe("education_only");
    expect(result.recommendedAction).toBe("continue_nurture");
  });
});
