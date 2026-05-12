import { describe, expect, it } from "vitest";
import { getInsightPost, getInsightPosts } from "./retire-ready-insights";

describe("RetireReadyMN insights content loader", () => {
  it("loads MDX posts with content operations frontmatter", async () => {
    const post = await getInsightPost("retirement-income-score-explained");

    expect(post).toMatchObject({
      slug: "retirement-income-score-explained",
      status: "published",
      authorType: "ai-assisted",
      reviewedBy: "internal-compliance",
      complianceStatus: "approved",
      ctaVariant: "score-checkup-educational"
    });
    expect(post?.sourceLinks.length).toBeGreaterThan(0);
    expect(post?.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}/u);
  });

  it("hides draft MDX posts from public queries", async () => {
    const publicPosts = await getInsightPosts();
    const allPosts = await getInsightPosts({ includeDrafts: true });

    expect(allPosts.some((post) => post.slug === "draft-minnesota-retirement-income-audit")).toBe(true);
    expect(publicPosts.some((post) => post.slug === "draft-minnesota-retirement-income-audit")).toBe(false);
  });
});
