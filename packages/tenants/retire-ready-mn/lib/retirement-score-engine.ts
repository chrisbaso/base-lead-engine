export type SavingsBucket =
  | "under-250000"
  | "250000-500000"
  | "500000-1000000"
  | "1000000-2000000"
  | "over-2000000";

export type PrimaryConcern =
  | "outliving_savings"
  | "market_crash"
  | "taxes"
  | "leaving_legacy"
  | "healthcare_costs";

export type RetirementScoreInput = {
  currentAge: number;
  targetRetirementAge: number;
  currentSavingsBucket: SavingsBucket;
  monthlySocialSecurity: number;
  desiredMonthlyIncome: number;
  primaryConcern: PrimaryConcern;
};

export type RetirementScoreBand = "Red" | "Yellow" | "Green";

export type RetirementScoreResult = {
  score: number;
  band: RetirementScoreBand;
  summary: string;
  currentSavingsEstimate: number;
  projectedAnnualPortfolioIncome: number;
  projectedMonthlyPortfolioIncome: number;
  projectedMonthlyIncome: number;
  desiredMonthlyIncome: number;
  monthlyGap: number;
  coverageRatio: number;
};

const savingsBucketMidpoints: Record<SavingsBucket, number> = {
  "under-250000": 125000,
  "250000-500000": 375000,
  "500000-1000000": 750000,
  "1000000-2000000": 1500000,
  "over-2000000": 2500000
};

export function calculateRetirementIncomeScore(input: RetirementScoreInput): RetirementScoreResult {
  const currentSavingsEstimate = savingsBucketMidpoints[input.currentSavingsBucket];
  const projectedAnnualPortfolioIncome = Math.round(currentSavingsEstimate * 0.04);
  const projectedMonthlyPortfolioIncome = Math.round(projectedAnnualPortfolioIncome / 12);
  const projectedMonthlyIncome = projectedMonthlyPortfolioIncome + input.monthlySocialSecurity;
  const coverageRatio =
    input.desiredMonthlyIncome > 0 ? projectedMonthlyIncome / input.desiredMonthlyIncome : 0;
  const score = calculateScore(coverageRatio, input);
  const band = score <= 50 ? "Red" : score <= 75 ? "Yellow" : "Green";
  const monthlyGap = Math.max(0, input.desiredMonthlyIncome - projectedMonthlyIncome);

  return {
    score,
    band,
    summary: summarizeScore(band),
    currentSavingsEstimate,
    projectedAnnualPortfolioIncome,
    projectedMonthlyPortfolioIncome,
    projectedMonthlyIncome,
    desiredMonthlyIncome: input.desiredMonthlyIncome,
    monthlyGap,
    coverageRatio
  };
}

function calculateScore(coverageRatio: number, input: RetirementScoreInput): number {
  if (coverageRatio >= 1) {
    return clampScore(80 + Math.round((coverageRatio - 1) * 45));
  }

  const concernAdjustment =
    input.primaryConcern === "outliving_savings" || input.primaryConcern === "healthcare_costs" ? 5 : 0;

  return clampScore(Math.round(coverageRatio * 90) + concernAdjustment);
}

function summarizeScore(band: RetirementScoreBand): string {
  if (band === "Green") {
    return "Your baseline income appears on track, with room to refine taxes, timing, and risk controls.";
  }

  if (band === "Yellow") {
    return "Your baseline income shows a modest gap that may improve with timing, withdrawal, or tax planning.";
  }

  return "Your baseline income shows a meaningful gap, so a written income plan may be especially useful.";
}

function clampScore(score: number): number {
  return Math.min(100, Math.max(0, score));
}
