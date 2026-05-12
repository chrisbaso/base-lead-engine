import { describe, expect, it } from "vitest";
import { summarizeAgentLeadStats, summarizeContentPerformance, summarizeVariantStats } from "./data";

describe("summarizeVariantStats", () => {
  it("rolls up quiz and email variant performance", () => {
    const stats = summarizeVariantStats({
      leads: [
        { status: "new", quiz_variant: "ops-leak", email_variant: "direct-fit" },
        { status: "new", quiz_variant: "ops-leak", email_variant: "owner-practical" },
        { status: "partial", quiz_variant: "truck-time", email_variant: "direct-fit" }
      ],
      emailSends: [
        { variant_id: "direct-fit", status: "sent", opened_at: "2026-05-12", clicked_at: null },
        { variant_id: "owner-practical", status: "sent", opened_at: "2026-05-12", clicked_at: "2026-05-12" }
      ],
      events: [
        {
          event_type: "affiliate.clicked",
          metadata: { quizVariant: "ops-leak", emailVariant: "owner-practical" }
        }
      ]
    });

    expect(stats.quizVariants).toMatchObject([
      {
        variantId: "ops-leak",
        leads: 2,
        affiliateClicks: 1
      },
      {
        variantId: "truck-time",
        leads: 0,
        affiliateClicks: 0
      }
    ]);
    expect(stats.emailVariants).toMatchObject([
      {
        variantId: "direct-fit",
        sends: 1,
        openRate: 100,
        clickRate: 0
      },
      {
        variantId: "owner-practical",
        sends: 1,
        openRate: 100,
        clickRate: 100,
        affiliateClicks: 1
      }
    ]);
  });
});

describe("summarizeContentPerformance", () => {
  it("rolls article funnel events into per-article performance rows", () => {
    const rows = summarizeContentPerformance({
      publications: [
        {
          slug: "retirement-income-score-explained",
          title: "What Your Retirement Income Score Means",
          category: "Retirement Income Planning",
          status: "published",
          published_at: "2026-05-03"
        }
      ],
      events: [
        { event_type: "article_viewed", metadata: { articleSlug: "retirement-income-score-explained" } },
        { event_type: "cta_clicked", metadata: { articleSlug: "retirement-income-score-explained" } },
        { event_type: "quiz_started_from_article", metadata: { articleSlug: "retirement-income-score-explained" } },
        { event_type: "lead_captured_from_article", metadata: { articleSlug: "retirement-income-score-explained" } },
        { event_type: "phone_captured_from_article", metadata: { articleSlug: "retirement-income-score-explained" } },
        { event_type: "advisor_assigned_from_article", metadata: { articleSlug: "retirement-income-score-explained" } }
      ]
    });

    expect(rows).toEqual([
      {
        slug: "retirement-income-score-explained",
        title: "What Your Retirement Income Score Means",
        category: "Retirement Income Planning",
        status: "published",
        publishedAt: "2026-05-03",
        views: 1,
        ctaClicks: 1,
        quizStarts: 1,
        leadCaptures: 1,
        phoneCaptures: 1,
        advisorAssignments: 1,
        leadCaptureRate: 100
      }
    ]);
  });
});

describe("summarizeAgentLeadStats", () => {
  it("counts automated annuity-intent recommendations by priority", () => {
    const stats = summarizeAgentLeadStats([
      {
        annuity_intent_band: "High",
        recommended_action: "priority_advisor_review",
        automation_priority: "hot"
      },
      {
        annuity_intent_band: "Medium",
        recommended_action: "nurture_then_review",
        automation_priority: "warm"
      },
      {
        annuity_intent_band: "High",
        recommended_action: "priority_advisor_review",
        automation_priority: "hot"
      }
    ]);

    expect(stats).toEqual({
      highIntent: 2,
      mediumIntent: 1,
      lowIntent: 0,
      hotPriority: 2,
      priorityReviews: 2
    });
  });
});
