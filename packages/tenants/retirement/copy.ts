export const retirementCopy = {
  offer: {
    brand: "Retirement Income Review",
    heroHeadline: "Estimate Your Retirement Paycheck in 30 Seconds",
    heroSubhead:
      "Enter four quick numbers to see how much monthly income your retirement savings could potentially produce.",
    primaryCta: "Calculate My Estimate",
    trustSignals: ["Secure & encrypted", "Educational only", "No commitment"]
  },
  gate: {
    headline: "Your Retirement Income Estimate Is Ready",
    subheadline: "Enter your details below to unlock your personalized monthly income range.",
    emailHelper: "We'll send a copy of your income snapshot to this address.",
    phoneHelper: "Optional — only if you'd like a personalized review call.",
    button: "Show My Income Estimate",
    consent:
      "By submitting this form, you agree that a licensed professional may follow up regarding your retirement income estimate. No obligation."
  },
  loadingMessages: [
    "Analyzing your retirement inputs…",
    "Calculating your estimated income range…",
    "Preparing your retirement snapshot…"
  ],
  methodology: {
    trigger: "How we calculate this",
    body: [
      "Your estimate is based on current fixed-income payout rates for your age group and target retirement date.",
      "The range reflects different strategy types — from conservative guaranteed-income approaches (lower end) to balanced strategies with growth potential (upper end). Your actual income will depend on the specific approach, current rate environment, and timing.",
      "This is an educational illustration only and does not represent any specific financial product or guarantee."
    ]
  },
  exitIntent: {
    headline: "Wait — Don't Lose Your Estimate",
    body: "We'll email your retirement income snapshot so you can review it when you're ready.",
    cta: "Email My Estimate",
    confirmationHeadline: "Check your inbox!",
    confirmationBody: "Your income snapshot is on its way.",
    footer: "No spam. Just your estimate. Unsubscribe anytime."
  },
  results: {
    monthlyIncomeLabel: "Illustrative Monthly Income Range",
    snapshotTitleSuffix: "Retirement Income Snapshot",
    profileAssessment: {
      high: "Strong candidate for further review",
      medium: "Worth exploring in more detail",
      low: "Good starting point for planning"
    },
    ctaHeadline: "Ready to See What This Means for You?",
    ctaBody:
      "A licensed retirement income professional can walk you through strategies tailored to your situation — regardless of what the market does.",
    ctaButton: "Lock In My Income — Free Review",
    noObligation: "No cost. No obligation. Educational review only."
  },
  video: {
    url: "https://app.heygen.com/embeds/5f5089a61f834cef8bd29e0099696812?autoplay=1&muted=1",
    mediumLowHeadline: "How Retirees Turn Savings Into a Monthly Paycheck",
    highHeadline: "See How Retirees Turn Savings Into a Monthly Paycheck — Without Market Risk",
    placement:
      "Shown before the CTA for medium, low, or unrefined leads; shown after the CTA for refined high-tier leads.",
    controls: "iframe allow=\"encrypted-media; fullscreen; autoplay\" allowFullScreen"
  },
  booking: {
    calendlyUrl: "https://calendly.com/your-link-here",
    headline: "You're All Set",
    primaryBody:
      "Book a free 20-minute call to walk through your numbers with a licensed professional. No obligation, no pressure.",
    urgency: "Limited review slots available this week"
  },
  disclaimers: [
    "This is an educational illustration, not a guarantee of future income. Actual income will depend on the specific strategy and current rates.",
    "This tool provides hypothetical illustrations for educational purposes only and does not constitute investment, tax, or legal advice.",
    "All consultations are free and educational. No product purchase required.",
    "All estimates are for educational purposes only and do not constitute financial advice.",
    "Your information is encrypted and never sold to third parties.",
    "Your savings figure is used only to generate an illustrative income range. It is not shared with any financial institution or product provider."
  ],
  labels: {
    concerns: {
      market_volatility: "Market Volatility",
      outliving_savings: "Outliving My Savings",
      income_stability: "Stable Monthly Income",
      taxes: "Tax Planning",
      unsure: "Not Sure Yet"
    },
    statuses: {
      working: "Currently Working",
      retiring_within_1_year: "Retiring Within the Next Year",
      retiring_in_1_3_years: "Planning to Retire in 1–3 Years",
      already_retired: "Already Retired"
    },
    marital: {
      single: "Single",
      married: "Married"
    },
    preferences: {
      guaranteed: "Predictable Income Is My Top Priority",
      growth: "Higher Potential, Even With Some Fluctuation",
      balanced: "A Mix of Stability and Growth",
      unsure: "Not Sure Yet"
    }
  }
} as const;
