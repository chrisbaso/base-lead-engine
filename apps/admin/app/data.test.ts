import { describe, expect, it } from "vitest";
import { summarizeVariantStats } from "./data";

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
