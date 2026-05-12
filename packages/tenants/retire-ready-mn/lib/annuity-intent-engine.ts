import type { PrimaryConcern, SavingsBucket } from "./retirement-score-engine";

export type IncomePreference =
  | "dependable_income"
  | "growth_flexibility"
  | "tax_efficiency"
  | "legacy_flexibility"
  | "not_sure";

export type AnnuityIntentInput = {
  currentAge: number;
  targetRetirementAge: number;
  currentSavingsBucket: SavingsBucket;
  monthlySocialSecurity: number;
  desiredMonthlyIncome: number;
  primaryConcern: PrimaryConcern;
  incomePreference?: IncomePreference | undefined;
  phone?: string | undefined;
  tcpaConsent?: boolean | undefined;
  articleSlug?: string | undefined;
};

export type AnnuityIntentBand = "Low" | "Medium" | "High";
export type AnnuityIntentSegment = "income_floor_ready" | "income_gap_researching" | "education_only";
export type AnnuityRecommendedAction = "priority_advisor_review" | "nurture_then_review" | "continue_nurture";

export type AnnuityIntentResult = {
  score: number;
  band: AnnuityIntentBand;
  segment: AnnuityIntentSegment;
  reasons: string[];
  recommendedAction: AnnuityRecommendedAction;
  automationPriority: "hot" | "warm" | "standard";
  nextBestEmailId: string;
  advisorTalkingPoints: string[];
  summary: string;
};

const savingsBucketMidpoints: Record<SavingsBucket, number> = {
  "under-250000": 125000,
  "250000-500000": 375000,
  "500000-1000000": 750000,
  "1000000-2000000": 1500000,
  "over-2000000": 2500000
};

export function calculateAnnuityBuyerIntent(input: AnnuityIntentInput): AnnuityIntentResult {
  const reasons: string[] = [];
  const advisorTalkingPoints: string[] = [];
  const currentSavings = savingsBucketMidpoints[input.currentSavingsBucket];
  const projectedMonthlyPortfolioIncome = Math.round((currentSavings * 0.04) / 12);
  const projectedMonthlyIncome = projectedMonthlyPortfolioIncome + input.monthlySocialSecurity;
  const monthlyGap = Math.max(0, input.desiredMonthlyIncome - projectedMonthlyIncome);
  const yearsToRetirement = input.targetRetirementAge - input.currentAge;
  let score = 0;

  if (currentSavings >= 1_000_000) {
    score += 35;
    reasons.push("Meaningful investable assets");
    advisorTalkingPoints.push("Review whether essential expenses are fully covered by dependable income.");
  } else if (currentSavings >= 500_000) {
    score += 25;
    reasons.push("Planning assets above $500K");
  } else if (currentSavings >= 250_000) {
    score += 12;
    reasons.push("Emerging retirement income planning assets");
  }

  if (input.currentAge >= 55 && input.currentAge <= 72) {
    score += 15;
    reasons.push("Near-retirement decision window");
  }

  if (yearsToRetirement >= 0 && yearsToRetirement <= 5) {
    score += 10;
    reasons.push("Retirement income decisions are near term");
  }

  if (monthlyGap >= 1_500) {
    score += 18;
    reasons.push("Material monthly income gap");
    advisorTalkingPoints.push(`Baseline income gap is about $${String(monthlyGap)} per month before detailed tax modeling.`);
  } else if (monthlyGap >= 500) {
    score += 10;
    reasons.push("Moderate monthly income gap");
  }

  if (input.primaryConcern === "outliving_savings") {
    score += 14;
    reasons.push("Longevity concern");
    advisorTalkingPoints.push("Discuss longevity risk and survivor income without recommending a specific product.");
  } else if (input.primaryConcern === "market_crash" || input.primaryConcern === "healthcare_costs") {
    score += 10;
    reasons.push("Risk-control concern");
  } else if (input.primaryConcern === "taxes") {
    score += 6;
    reasons.push("Tax-aware income concern");
  }

  if (input.incomePreference === "dependable_income") {
    score += 20;
    reasons.push("Dependable income preference");
    advisorTalkingPoints.push("Compare income-floor options with liquidity, inflation, survivor, and tax tradeoffs.");
  } else if (input.incomePreference === "not_sure") {
    score += 6;
    reasons.push("Needs education on income tradeoffs");
  } else if (input.incomePreference === "tax_efficiency") {
    score += 4;
    reasons.push("Tax efficiency preference");
  }

  if (isGuaranteedIncomeArticle(input.articleSlug)) {
    score += 8;
    reasons.push("Engaged with guaranteed-income education");
  }

  if (input.phone && input.tcpaConsent) {
    score += 10;
    reasons.push("Phone consent captured");
  }

  const clampedScore = Math.min(100, Math.max(0, score));
  const band: AnnuityIntentBand = clampedScore >= 70 ? "High" : clampedScore >= 45 ? "Medium" : "Low";
  const segment = resolveSegment(band, monthlyGap, input.incomePreference);
  const recommendedAction = resolveAction(band);

  return {
    score: clampedScore,
    band,
    segment,
    reasons,
    recommendedAction,
    automationPriority: band === "High" ? "hot" : band === "Medium" ? "warm" : "standard",
    nextBestEmailId: segment === "income_floor_ready" ? "guaranteed-income" : "four-percent-rule",
    advisorTalkingPoints,
    summary: summarizeIntent(band, segment)
  };
}

function resolveSegment(
  band: AnnuityIntentBand,
  monthlyGap: number,
  incomePreference: IncomePreference | undefined
): AnnuityIntentSegment {
  if (band === "High" && incomePreference === "dependable_income") {
    return "income_floor_ready";
  }

  if (band !== "Low" || monthlyGap >= 1_500) {
    return "income_gap_researching";
  }

  return "education_only";
}

function resolveAction(band: AnnuityIntentBand): AnnuityRecommendedAction {
  if (band === "High") {
    return "priority_advisor_review";
  }

  if (band === "Medium") {
    return "nurture_then_review";
  }

  return "continue_nurture";
}

function summarizeIntent(band: AnnuityIntentBand, segment: AnnuityIntentSegment): string {
  if (band === "High") {
    return "High-fit income-floor conversation: prioritize human review and keep the framing educational.";
  }

  if (segment === "income_gap_researching") {
    return "Researching income gaps: continue education and review after engagement or phone consent.";
  }

  return "Education-first visitor: keep nurturing with planning basics before advisor handoff.";
}

function isGuaranteedIncomeArticle(slug: string | undefined): boolean {
  return Boolean(slug?.includes("annuit") || slug?.includes("guaranteed-income"));
}
