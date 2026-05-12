import type { TenantConfigInput } from "@ble/tenant-schema";

export const retireReadyMnSequences = [
  {
    id: "score-immediate",
    subject: "Your Retirement Income Score is {retirementScore}",
    delayHours: 0,
    template:
      "Hi {firstName},\n\nYour Retirement Income Score is {retirementScore} ({scoreBand}).\n\nYour projected monthly retirement income is {projectedMonthlyIncome}, compared with a desired monthly income of {desiredMonthlyIncome}. That estimate combines a simplified 4% portfolio income baseline with your estimated Social Security benefit.\n\nWhat can improve the score: more dependable income sources, lower fixed expenses, clearer Social Security timing, a tax-aware withdrawal order, and written rules for market stress early in retirement.\n\nYour score is a starting point, not a recommendation. This is educational only and does not provide investment, tax, legal, insurance, or annuity recommendations.\n\n- RetireReadyMN"
  },
  {
    id: "four-percent-rule",
    subject: "Where the 4% rule falls short for Minnesota retirees",
    delayHours: 48,
    template:
      "Hi {firstName},\n\nThe 4% rule is useful as a quick baseline, but it is not a retirement income plan. It ignores tax location, Social Security timing, healthcare costs, and the order in which market returns arrive.\n\nMinnesota households often need a layered approach: dependable income for fixed expenses, flexible withdrawals for lifestyle spending, and a tax plan that keeps more options open.\n\n- RetireReadyMN"
  },
  {
    id: "social-security-timing",
    subject: "Social Security timing: why claiming at 67 vs 70 can materially change the plan",
    delayHours: 96,
    template:
      "Hi {firstName},\n\nClaiming Social Security is one of the few retirement decisions that can permanently change monthly income. Waiting is not always right, but the difference between full retirement age and age 70 can materially change survivor benefits, tax planning, and portfolio withdrawal pressure.\n\nThe right timing depends on health, income need, marital status, taxes, and portfolio risk.\n\n- RetireReadyMN"
  },
  {
    id: "sequence-risk",
    subject: "Sequence of returns risk - why first-five-year market timing matters",
    delayHours: 168,
    template:
      "Hi {firstName},\n\nAverage market return is not the same as retirement safety. A bad market in the first few years of withdrawals can damage a plan even if long-term averages look fine.\n\nUseful defenses include cash reserves, flexible withdrawal rules, income floors, and avoiding forced selling after market declines.\n\n- RetireReadyMN"
  },
  {
    id: "guaranteed-income",
    subject: "How guaranteed income changes the math (without picking products)",
    delayHours: 240,
    template:
      "Hi {firstName},\n\nDependable income can reduce the amount your portfolio must produce each month. That does not mean any product is appropriate for you. It means the income floor should be evaluated against cost, liquidity, inflation, survivor needs, taxes, and alternatives.\n\nGood planning starts with the gap, not the product. The goal is to compare tradeoffs, not to pressure a product decision.\n\n- RetireReadyMN"
  },
  {
    id: "minnesota-taxes",
    subject: "Minnesota tax considerations for retirees - what most people miss",
    delayHours: 336,
    template:
      "Hi {firstName},\n\nRetirement income planning is also tax planning. Account type, Social Security taxation, RMD timing, Roth conversion windows, and state-specific rules can all affect how much income a Minnesota retiree keeps.\n\nThe goal is not to avoid taxes entirely. It is to avoid preventable tax surprises.\n\n- RetireReadyMN"
  },
  {
    id: "review-intro",
    subject: "Ready to talk? Here's how a 15-minute review with a local specialist works",
    delayHours: 432,
    template:
      "Hi {firstName},\n\nA short retirement income review is meant to clarify the next question, not pressure you into a product. A local specialist can review your score, ask what changed since you completed the checkup, and identify whether a deeper income plan would be useful.\n\nIf you requested a match, someone will reach out directly. If not, you can simply keep using this score as a planning prompt.\n\n- RetireReadyMN"
  }
] satisfies TenantConfigInput["email"]["sequences"];
