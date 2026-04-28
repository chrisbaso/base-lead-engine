import { describe, expect, it } from "vitest";
import demoTenant from "@ble/tenant-demo";
import { computeLeadScore } from "./index";

describe("computeLeadScore", () => {
  it("scores and qualifies a strong demo lead", () => {
    const result = computeLeadScore(demoTenant, {
      monthly_leads: 150,
      launch_goal: "Calculator funnel",
      company: "Acme"
    });

    expect(result.score).toBe(70);
    expect(result.qualified).toBe(true);
    expect(result.reasons).toContain("High monthly lead target");
  });
});
