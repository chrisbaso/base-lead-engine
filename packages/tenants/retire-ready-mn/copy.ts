export const retireReadyMnCopy = {
  identity: {
    name: "RetireReadyMN",
    headline: "Minnesota's Retirement Income Checkup",
    tagline: "See your retirement income score in two minutes. Free, private, built for Minnesotans.",
    cta: "Get Your Retirement Income Score - 2 Minutes, Free"
  },
  heroVariants: [
    {
      id: "score-first",
      headline: "See your retirement income score in two minutes.",
      subheadline:
        "A private Minnesota-focused checkup that compares projected income against the monthly income you want in retirement."
    },
    {
      id: "income-gap",
      headline: "Find the gap between your savings and your future paycheck.",
      subheadline:
        "Answer seven quick questions and get a retirement income score built around Social Security, savings, and Minnesota planning concerns."
    }
  ],
  quizFrames: [
    {
      id: "checkup",
      label: "Retirement Income Checkup"
    },
    {
      id: "scorecard",
      label: "Minnesota Income Scorecard"
    }
  ],
  footerDisclosure:
    "RetireReadyMN is an educational resource. We connect Minnesotans with licensed local advisors for retirement income reviews. We are not a registered investment advisor.",
  calculatorDisclosure:
    "This checkup is educational and uses a simplified 4% portfolio income baseline plus your estimated Social Security benefit. It does not account for every tax, market, inflation, healthcare, or longevity variable and is not a recommendation or guarantee.",
  matchIntro:
    "We've connected you with {advisorName}, a licensed retirement specialist in Minnesota. They'll reach out within 48 hours."
} as const;
