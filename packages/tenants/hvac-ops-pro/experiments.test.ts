import { describe, expect, it } from "vitest";
import {
  getHvacEmailVariation,
  getHvacQuizVariation,
  resolveHvacExperimentAssignment
} from "./experiments";

describe("HVAC Ops Pro experiments", () => {
  it("resolves valid quiz and email variants from source values", () => {
    expect(
      resolveHvacExperimentAssignment({
        quizVariant: "truck-time",
        emailVariant: "owner-practical"
      })
    ).toEqual({
      quizVariant: "truck-time",
      emailVariant: "owner-practical"
    });
  });

  it("falls back to the control variants for unknown source values", () => {
    expect(
      resolveHvacExperimentAssignment({
        quizVariant: "unknown",
        emailVariant: "also-unknown"
      })
    ).toEqual({
      quizVariant: "ops-leak",
      emailVariant: "direct-fit"
    });
  });

  it("returns copy for selected quiz and email variants", () => {
    expect(getHvacQuizVariation("owner-shortcut").headline).toContain("actually look at first");
    expect(getHvacEmailVariation("pain-first").subject).toBe(
      "The software fit I would test for your HVAC team"
    );
  });
});
