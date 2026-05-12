export type AdAngle =
  | "score-curiosity"
  | "income-gap-awareness"
  | "social-security-timing"
  | "market-risk-protection"
  | "tax-strategy"
  | "longevity-concern"
  | "minnesota-local";

export type MetaCTA =
  | "LEARN_MORE"
  | "GET_OFFER"
  | "GET_QUOTE"
  | "DOWNLOAD"
  | "SIGN_UP"
  | "SEE_MORE";

export type AdCreative = {
  id: string;
  angle: AdAngle;
  primaryText: string;
  headline: string;
  description: string;
  cta: MetaCTA;
  alignedHeroVariant: "score-first" | "income-gap";
  alignedQuizFrame: "checkup" | "scorecard";
  imageBrief: string;
  complianceNotes: string;
};

export const adCreatives: readonly AdCreative[] = [
  {
    id: "score-in-two-minutes",
    angle: "score-curiosity",
    primaryText:
      "See your retirement score in two minutes with a Minnesota-focused checkup built around income, savings, and timing.",
    headline: "See Your Retirement Income Score",
    description: "Private 2-minute checkup",
    cta: "LEARN_MORE",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Score gauge graphic in navy and gold with a clean Minnesota outline behind it.",
    complianceNotes:
      "Avoided return promises, product claims, and urgent wording; kept the hook educational.",
  },
  {
    id: "what-score-signals",
    angle: "score-curiosity",
    primaryText:
      "Your score can show where savings, Social Security, and desired income may need closer review before retirement.",
    headline: "What Your Income Score Signals",
    description: "Start with a clear score",
    cta: "SEE_MORE",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Simple scorecard grid with income, savings, and timing rows on a white background.",
    complianceNotes:
      "Avoided implying a perfect score or specific outcome; focused on planning review.",
  },
  {
    id: "private-income-checkup",
    angle: "score-curiosity",
    primaryText:
      "Start with a private checkup that compares your expected income with the monthly income you want.",
    headline: "Start With a Private Checkup",
    description: "No sales pitch, just math",
    cta: "SIGN_UP",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Minimal calculator illustration beside a lock icon and income score label.",
    complianceNotes:
      "Avoided product endorsements, scare language, and pressure-based claims.",
  },
  {
    id: "score-before-advisor",
    angle: "score-curiosity",
    primaryText:
      "Know your income score before a meeting, so you can ask clearer questions about savings, taxes, and timing.",
    headline: "Know Your Score Before Review",
    description: "Prepare better questions",
    cta: "DOWNLOAD",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Clean worksheet layout with a score circle and three planning question rows.",
    complianceNotes:
      "Avoided advisor distrust framing and kept the value on preparation.",
  },
  {
    id: "monthly-income-gap",
    angle: "income-gap-awareness",
    primaryText:
      "What monthly income could your savings support? Compare a simple baseline against the paycheck you want.",
    headline: "Find Your Monthly Income Gap",
    description: "Compare savings to income",
    cta: "LEARN_MORE",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Clean chart showing projected monthly income next to desired monthly income.",
    complianceNotes:
      "Avoided exact income promises and kept the baseline framed as an estimate.",
  },
  {
    id: "savings-paycheck-check",
    angle: "income-gap-awareness",
    primaryText:
      "Your savings are a number. The checkup turns them into a monthly income estimate you can review.",
    headline: "Turn Savings Into a Paycheck",
    description: "See a monthly baseline",
    cta: "SEE_MORE",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Simple savings balance tile flowing into a monthly income tile with neutral arrows.",
    complianceNotes:
      "Avoided certainty about future income and avoided naming specific products.",
  },
  {
    id: "four-percent-limits",
    angle: "income-gap-awareness",
    primaryText:
      "The 4% rule has limits. See how a simple withdrawal baseline compares with your retirement income goal.",
    headline: "Test the 4% Rule Baseline",
    description: "Know where math may bend",
    cta: "DOWNLOAD",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Withdrawal rate slider with a side-by-side income goal comparison.",
    complianceNotes:
      "Avoided presenting the 4% rule as advice or a fixed recommendation.",
  },
  {
    id: "income-plan-starting-point",
    angle: "income-gap-awareness",
    primaryText:
      "Build your first income view by lining up Social Security, savings withdrawals, and the gap between them.",
    headline: "Build Your Income Starting Point",
    description: "Map sources and gaps",
    cta: "GET_OFFER",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Stacked income-source bars leading into a gap marker on a white dashboard.",
    complianceNotes:
      "Avoided outcome claims and positioned the checkup as a starting point.",
  },
  {
    id: "claiming-age-tradeoffs",
    angle: "social-security-timing",
    primaryText:
      "Social Security timing can shift your income plan. Review the tradeoffs before choosing a claiming age.",
    headline: "Review Claiming Age Tradeoffs",
    description: "See timing side by side",
    cta: "LEARN_MORE",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Timeline graphic comparing Social Security start ages with monthly income markers.",
    complianceNotes:
      "Avoided saying one claiming age is best for everyone; emphasized tradeoffs.",
  },
  {
    id: "social-security-income-view",
    angle: "social-security-timing",
    primaryText:
      "See how Social Security fits with savings withdrawals, taxes, and the monthly income you want.",
    headline: "Fit Social Security Into Income",
    description: "Coordinate key sources",
    cta: "SEE_MORE",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Three-column income map for Social Security, savings, and taxes.",
    complianceNotes:
      "Avoided benefit-maximization promises and kept the copy planning-focused.",
  },
  {
    id: "claiming-delay-comparison",
    angle: "social-security-timing",
    primaryText:
      "Compare claiming later with claiming sooner in a plain income checkup built for Minnesota planning.",
    headline: "Compare Claiming Scenarios",
    description: "View timing in context",
    cta: "GET_QUOTE",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Two-path timeline with neutral labels for earlier and later claiming scenarios.",
    complianceNotes:
      "Avoided implying approval, eligibility, or a universal claiming answer.",
  },
  {
    id: "market-drop-income-stress",
    angle: "market-risk-protection",
    primaryText:
      "Markets move. Your income plan should show how early losses could affect withdrawals and reserves.",
    headline: "Stress Test Income Withdrawals",
    description: "Model market pressure",
    cta: "LEARN_MORE",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Line chart dip with calm reserve and withdrawal labels on a white background.",
    complianceNotes:
      "Avoided panic language and avoided suggesting market losses can be eliminated.",
  },
  {
    id: "sequence-risk-check",
    angle: "market-risk-protection",
    primaryText:
      "Early retirement losses can change the math. Check how your income plan handles the first five years.",
    headline: "Check First-Five-Year Risk",
    description: "Review withdrawal timing",
    cta: "SEE_MORE",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Five-year timeline with a muted market dip and withdrawal schedule overlay.",
    complianceNotes:
      "Avoided dramatic downturn wording and kept the framing on stress testing.",
  },
  {
    id: "downturn-ready-income-plan",
    angle: "market-risk-protection",
    primaryText:
      "Before markets turn, review which income sources cover basics and which rely on portfolio withdrawals.",
    headline: "Review Your Downturn Plan",
    description: "Separate basics and risk",
    cta: "DOWNLOAD",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Two-bucket planning graphic separating basic expenses from market-linked withdrawals.",
    complianceNotes:
      "Avoided protection guarantees and focused on planning categories.",
  },
  {
    id: "mn-tax-checklist",
    angle: "tax-strategy",
    primaryText:
      "Minnesota taxes can shape retirement cash flow. Use a checklist for IRA withdrawals, Social Security, and Roth moves.",
    headline: "Use a Minnesota Tax Checklist",
    description: "Plan cash flow clearly",
    cta: "DOWNLOAD",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Checklist illustration with Minnesota tax, IRA, Social Security, and Roth rows.",
    complianceNotes:
      "Avoided tax-savings promises and avoided replacing professional tax advice.",
  },
  {
    id: "roth-rmd-window",
    angle: "tax-strategy",
    primaryText:
      "The years before RMDs may offer tax planning room. See how that window fits your income timeline.",
    headline: "Review the Pre-RMD Tax Window",
    description: "Map taxes before RMDs",
    cta: "LEARN_MORE",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Calendar-window graphic showing Roth conversion and RMD planning years.",
    complianceNotes:
      "Avoided claiming tax reductions and kept the message scenario-based.",
  },
  {
    id: "taxable-income-sources",
    angle: "tax-strategy",
    primaryText:
      "A retirement paycheck can draw from several accounts. Check how each source may affect taxable income.",
    headline: "Check Taxable Income Sources",
    description: "Compare account order",
    cta: "SEE_MORE",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Account-order diagram with taxable, IRA, Roth, and Social Security labels.",
    complianceNotes:
      "Avoided ranking account order as advice and avoided specific tax outcomes.",
  },
  {
    id: "outliving-savings-check",
    angle: "longevity-concern",
    primaryText:
      "Will savings last as long as the plan? Start with a calm checkup on income, withdrawals, and time horizon.",
    headline: "Check How Long Savings May Last",
    description: "Review income durability",
    cta: "LEARN_MORE",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Horizontal timeline with savings balance and income needs shown as simple blocks.",
    complianceNotes:
      "Avoided fear-based wording and avoided promising a lifetime result.",
  },
  {
    id: "longer-retirement-math",
    angle: "longevity-concern",
    primaryText:
      "Longer retirements need clearer income math. Compare the income you want with what savings may support.",
    headline: "Run Longer Retirement Math",
    description: "See savings in context",
    cta: "SEE_MORE",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Retirement timeline stretching across decades with monthly income checkpoints.",
    complianceNotes:
      "Avoided certainty about asset duration and kept projections educational.",
  },
  {
    id: "income-for-decades",
    angle: "longevity-concern",
    primaryText:
      "A steady paycheck mindset can help you review whether savings, Social Security, and reserves work together.",
    headline: "Plan Income Across Decades",
    description: "Review the full picture",
    cta: "SIGN_UP",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Decade-by-decade income roadmap with savings, Social Security, and reserve icons.",
    complianceNotes:
      "Avoided product-specific income language and avoided certainty claims.",
  },
  {
    id: "mn-lake-checkup",
    angle: "minnesota-local",
    primaryText:
      "Minnesota planning has local details. Take a checkup built around income, taxes, and Social Security timing.",
    headline: "Take the Minnesota Checkup",
    description: "Local planning context",
    cta: "LEARN_MORE",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Abstract Minnesota lake horizon with a subtle income checkup overlay.",
    complianceNotes:
      "Avoided forced local pride and kept the Minnesota reference tied to planning details.",
  },
  {
    id: "twin-cities-income-map",
    angle: "minnesota-local",
    primaryText:
      "From the Twin Cities to lake country, income planning starts with knowing the gap your savings may need to cover.",
    headline: "Map Your Minnesota Income Gap",
    description: "See the gap in minutes",
    cta: "SEE_MORE",
    alignedHeroVariant: "income-gap",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "Minnesota map outline with a clean income gap bar and neutral city-to-lake markers.",
    complianceNotes:
      "Avoided broad promises for Minnesota residents and kept the claim informational.",
  },
  {
    id: "north-star-scorecard",
    angle: "minnesota-local",
    primaryText:
      "Use a North Star view of retirement income with a scorecard that keeps the math simple and private.",
    headline: "Use a North Star Income Scorecard",
    description: "Private Minnesota view",
    cta: "GET_OFFER",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "scorecard",
    imageBrief:
      "North Star compass mark paired with a scorecard panel in navy, white, and gold.",
    complianceNotes:
      "Avoided hype and avoided treating the score as a personal recommendation.",
  },
  {
    id: "mn-checkup-no-sales-pitch",
    angle: "minnesota-local",
    primaryText:
      "Start with Minnesota-focused retirement math before you compare tools, advisors, or income strategies.",
    headline: "Start With Minnesota Math",
    description: "Plain income planning",
    cta: "SIGN_UP",
    alignedHeroVariant: "score-first",
    alignedQuizFrame: "checkup",
    imageBrief:
      "Minimal calculator and Minnesota outline with income source labels.",
    complianceNotes:
      "Avoided product-first copy and avoided pressure to speak with an advisor.",
  },
];
