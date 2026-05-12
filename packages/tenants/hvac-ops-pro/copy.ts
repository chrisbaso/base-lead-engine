export const hvacQuizCopyVariations = [
  {
    id: "ops-leak",
    headline: "Find the HVAC software that fits your shop",
    subheadline:
      "Answer five quick questions. Get one direct recommendation for scheduling, dispatch, invoicing, and follow-up.",
    ctaLabel: "Get my recommendation"
  },
  {
    id: "truck-time",
    headline: "Stop losing jobs in the gaps between calls, trucks, and invoices",
    subheadline:
      "Tell us how your HVAC team runs today and we will point you to the platform most likely to clean up the bottleneck.",
    ctaLabel: "Match my shop"
  },
  {
    id: "owner-shortcut",
    headline: "Which HVAC software should you actually look at first?",
    subheadline:
      "Skip the vendor rabbit hole. Five questions, one plain-English recommendation, and the link to check it out.",
    ctaLabel: "Show me the best fit"
  }
] as const;

export const hvacFirstEmailVariations = [
  {
    id: "direct-fit",
    subject: "Your HVAC software recommendation: {recommendedSoftware}",
    template:
      "Hi {firstName},\n\nBased on your answers, I would start with {recommendedSoftware}.\n\nWhy: {recommendationReason}\n\nHere is the link to look it over: {affiliateUrl}\n\nYou do not need more dashboards for the sake of dashboards. You need fewer missed calls, cleaner scheduling, faster invoices, and techs who know where to go next.\n\nOver the next two weeks I will send a few short notes on what to watch for before you switch software.\n\n- HVAC Ops Pro"
  },
  {
    id: "owner-practical",
    subject: "I would look at {recommendedSoftware} first",
    template:
      "Hi {firstName},\n\nYour answers point to {recommendedSoftware} as the first platform worth checking.\n\nThe main reason: {recommendationReason}\n\nTake a look here: {affiliateUrl}\n\nA good HVAC platform should make the workday quieter: fewer callbacks slipping, fewer invoice delays, and less time asking where each tech is.\n\nI will send a few practical notes soon on scheduling, switching, and what not to overpay for.\n\n- HVAC Ops Pro"
  },
  {
    id: "pain-first",
    subject: "The software fit I would test for your HVAC team",
    template:
      "Hi {firstName},\n\nIf I were in your seat, I would test {recommendedSoftware} first.\n\nYour recommendation is based on this: {recommendationReason}\n\nHere is the link: {affiliateUrl}\n\nDo not shop this like a spreadsheet contest. Start with the daily headache you named, then ask whether the platform removes that problem for the owner, the office, and the tech in the truck.\n\nI will follow up with a few short checks to use before you commit.\n\n- HVAC Ops Pro"
  }
] as const;

export const hvacNurtureTemplates = {
  schedulingMistakes:
    "Hi {firstName},\n\nThree things HVAC owners get wrong about scheduling software:\n\n1. They buy for the office and forget the tech. If the field team will not use it, the schedule is still a guess.\n\n2. They ignore call follow-up. A clean calendar does not help if sold jobs leak before they are booked.\n\n3. They keep old dispatch habits. Software will not fix a messy handoff unless the process changes with it.\n\nYour recommended platform was {recommendedSoftware}: {affiliateUrl}\n\n- HVAC Ops Pro",
  dallasCaseStudy:
    "Hi {firstName},\n\nMike runs an 8-truck HVAC company in Dallas. Fictional example, real pattern.\n\nHis team was not short on leads. They were short on clean handoffs. Calls came in, jobs got booked, techs got moved around, and invoices waited until someone had time to chase paperwork.\n\nThe fix was not buying the most expensive software. It was choosing the platform that matched the size of his team and the bottleneck that hurt every day.\n\nFor your answers, that points back to {recommendedSoftware}: {affiliateUrl}\n\n- HVAC Ops Pro",
  objections:
    "Hi {firstName},\n\nThe usual objections are real.\n\nCost: bad software costs money, but so do missed appointments, slow invoices, and callbacks nobody owns.\n\nLearning curve: pick the platform your office and techs can actually run, not the one with the longest feature list.\n\nSwitching pain: expect a messy week. Avoid a messy year.\n\nYour best-fit starting point is still {recommendedSoftware}: {affiliateUrl}\n\n- HVAC Ops Pro",
  finalNudge:
    "Hi {firstName},\n\nLast nudge from me.\n\nIf scheduling, dispatch, invoicing, or follow-up is costing you jobs, do not let the software search sit in the someday pile. Pick one platform, test the daily workflow, and decide.\n\nBased on your answers, start with {recommendedSoftware}: {affiliateUrl}\n\nVendor promos change, so check the current offer while it is available.\n\n- HVAC Ops Pro"
} as const;
