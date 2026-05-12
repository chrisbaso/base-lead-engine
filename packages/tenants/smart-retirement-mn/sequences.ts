import type { TenantConfigInput } from "@ble/tenant-schema";

export const smartRetirementSequences = [
  {
    id: "estimate-ready",
    subject: "Your retirement income estimate is inside",
    delayHours: 0,
    template:
      "Hi {firstName},\n\nThanks for running your numbers through our calculator. Your monthly income estimate range was {monthlyLow}–{monthlyHigh}.\n\nA few things worth knowing about that number:\n\nIt's based on a standard 4% sustainable-withdrawal model with two market scenarios (a cautious one and a favorable one). It assumes you stop adding to savings today and don't change your retirement timeline. In real life you'd probably do both, which is why a personalized plan almost always produces a better answer than a calculator.\n\nThe most useful thing this estimate tells you is direction. If the range surprised you on the low side, that's worth talking about. If it surprised you on the high side, that's worth talking about too — because high estimates are usually where retirement plans hide their biggest tax bills.\n\nIf you'd like to walk through your specific situation, I keep a few 15-minute slots open each week for a no-pressure conversation: {schedulingUrl}\n\nEither way, I'll send a few more notes over the next couple weeks on the topics that come up most often with people in your situation. If you'd rather not hear from me again, the unsubscribe link is at the bottom — no offense taken.\n\n— Chris Baso, CFP®, CLU®, RICP®\nSmart Retirement MN"
  },
  {
    id: "sequence-risk",
    subject: "The biggest mistake I see in retirement income plans",
    delayHours: 72,
    template:
      "Hi {firstName},\n\nThe single most common mistake I see in retirement income planning is also the simplest one to avoid: people plan for the average return their portfolio is expected to earn over thirty years, instead of planning for the order in which those returns show up.\n\nTwo retirees can both earn an average 7% return over a 30-year retirement and end up in completely different places, depending on whether the bad years come first or last. Researchers call this sequence-of-returns risk. It's the reason a 5-year stretch of bad markets at the start of retirement can permanently damage a portfolio that would have been fine if the same losses had happened ten years later.\n\nMost calculators (including the one you used) don't model this. They assume averages. Real plans don't have that luxury.\n\nA few practical defenses against sequence risk:\n\nKeeping 1–3 years of expenses in cash or short bonds so you don't sell stocks in a downturn.\n\nBuilding a guaranteed income floor (Social Security, pensions, sometimes annuities) that covers fixed expenses regardless of market performance.\n\nHaving a written rule for reducing withdrawals when markets fall, instead of taking the same amount no matter what.\n\nIf you'd like to see how your specific situation handles a bad-sequence stress test, that's something we model in every plan we build. Easiest path to that conversation: {schedulingUrl}\n\n— Chris"
  },
  {
    id: "roth-conversions",
    subject: "Roth conversions — when they pay off and when they don't",
    delayHours: 168,
    template:
      "Hi {firstName},\n\nThe retirement question I get asked most often is some version of \"should I be doing Roth conversions?\"\n\nThe honest answer is \"it depends,\" and the things it depends on are usually different than people expect.\n\nRoth conversions tend to pay off when:\n\nYour tax bracket today is lower than what you expect your bracket to be in retirement.\n\nYou have non-retirement money available to pay the tax on the conversion (using IRA money to pay the tax usually erases the benefit).\n\nYou're in the gap years between retiring and starting Social Security, when income is artificially low.\n\nYou're trying to reduce future RMDs that would push you into a higher bracket later.\n\nThey tend to not pay off when:\n\nYou'll be in a lower tax bracket in retirement than you are now.\n\nYou'd have to pay the conversion tax from the IRA itself.\n\nYou're close to a Medicare income threshold that the conversion would push you over.\n\nThe math runs differently for every household. The biggest mistake is doing them by reflex because they sound smart, or skipping them because they sound scary. The right approach is modeling the tax cost both ways.\n\nRoth conversion analysis is one of the things our planning process and our CPA partners do together — your advisor and your CPA need to be looking at the same spreadsheet, and most of the time they aren't.\n\nIf you want to see whether conversions make sense for your situation: {schedulingUrl}\n\n— Chris"
  },
  {
    id: "should-we-talk",
    subject: "Should we talk?",
    delayHours: 336,
    template:
      "Hi {firstName},\n\nThree emails in, here's where I'll be direct: a calculator estimate is a starting point, not a plan. The people I work with who feel genuinely confident about their retirement aren't the ones with the biggest balances. They're the ones who have actually mapped what every year between now and age 90 looks like — income sources, tax brackets, healthcare costs, what happens if one spouse outlives the other, what happens if markets are bad in 2027.\n\nThat mapping is the work we do. It takes one or two conversations to do well, and it's the kind of work that pays for itself many times over if it catches even one of the standard retirement-income mistakes (taking Social Security at the wrong age, missing Roth conversion opportunities, holding the wrong assets in the wrong accounts).\n\nIf you'd like to start that conversation, I keep a handful of 15-minute calls open each week. There's no obligation and no sales pitch on the first call — it's just to see whether what we do is a fit for what you need: {schedulingUrl}\n\nIf now isn't the right time, that's fine too. The calculator and the emails will still be here when it is.\n\n— Chris Baso, CFP®, CLU®, RICP®\nSmart Retirement MN\n\nP.S. If you do schedule, please bring your most recent retirement account statement(s). It makes the conversation 10x more useful."
  }
] satisfies TenantConfigInput["email"]["sequences"];
