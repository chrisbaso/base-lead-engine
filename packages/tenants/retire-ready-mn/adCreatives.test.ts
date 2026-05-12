import { describe, expect, it } from "vitest";
import { adCreatives } from "@ble/tenant-retire-ready-mn/adCreatives";

const bannedPhrases = [
  "guaranteed income",
  "risk-free",
  "secure your retirement",
  "the secret to",
  "what banks don't want you to know",
  "limited time",
  "wall street doesn't want you to know",
];

describe("RetireReadyMN ad creatives", () => {
  it("contains the requested library volume", () => {
    expect(adCreatives).toHaveLength(24);
  });

  it("keeps Meta primary text within the copy length guardrails", () => {
    for (const creative of adCreatives) {
      expect(creative.primaryText.length, creative.id).toBeGreaterThanOrEqual(
        80,
      );
      expect(creative.primaryText.length, creative.id).toBeLessThanOrEqual(125);
    }
  });

  it("keeps headlines and descriptions within placement limits", () => {
    for (const creative of adCreatives) {
      expect(creative.headline.length, creative.id).toBeLessThanOrEqual(40);
      expect(creative.description.length, creative.id).toBeLessThanOrEqual(27);
    }
  });

  it("does not use banned compliance phrases anywhere in a creative", () => {
    for (const creative of adCreatives) {
      const creativeText = Object.values(creative).join(" ").toLowerCase();

      for (const phrase of bannedPhrases) {
        expect(creativeText, `${creative.id} uses "${phrase}"`).not.toContain(
          phrase,
        );
      }
    }
  });

  it("covers every strategic angle with at least two creatives", () => {
    const countsByAngle = adCreatives.reduce<Record<string, number>>(
      (counts, creative) => {
        counts[creative.angle] = (counts[creative.angle] ?? 0) + 1;
        return counts;
      },
      {},
    );

    expect(countsByAngle["score-curiosity"]).toBeGreaterThanOrEqual(2);
    expect(countsByAngle["income-gap-awareness"]).toBeGreaterThanOrEqual(2);
    expect(countsByAngle["social-security-timing"]).toBeGreaterThanOrEqual(2);
    expect(countsByAngle["market-risk-protection"]).toBeGreaterThanOrEqual(2);
    expect(countsByAngle["tax-strategy"]).toBeGreaterThanOrEqual(2);
    expect(countsByAngle["longevity-concern"]).toBeGreaterThanOrEqual(2);
    expect(countsByAngle["minnesota-local"]).toBeGreaterThanOrEqual(2);
  });

  it("aligns at least eight creatives to each hero variant", () => {
    const countsByHeroVariant = adCreatives.reduce<Record<string, number>>(
      (counts, creative) => {
        counts[creative.alignedHeroVariant] =
          (counts[creative.alignedHeroVariant] ?? 0) + 1;
        return counts;
      },
      {},
    );

    expect(countsByHeroVariant["score-first"]).toBeGreaterThanOrEqual(8);
    expect(countsByHeroVariant["income-gap"]).toBeGreaterThanOrEqual(8);
  });

  it("uses all supported CTA options across the library", () => {
    expect(new Set(adCreatives.map((creative) => creative.cta))).toEqual(
      new Set([
        "LEARN_MORE",
        "GET_OFFER",
        "GET_QUOTE",
        "DOWNLOAD",
        "SIGN_UP",
        "SEE_MORE",
      ]),
    );
  });
});
