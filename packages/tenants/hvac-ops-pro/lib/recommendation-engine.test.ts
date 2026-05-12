import { describe, expect, it } from "vitest";
import { recommendHvacSoftware } from "./recommendation-engine";

describe("recommendHvacSoftware", () => {
  it("recommends ServiceTitan for larger operations", () => {
    expect(
      recommendHvacSoftware({
        teamSize: "16+",
        biggestHeadache: "customer follow-up",
        monthlyRevenueRange: "$250k+"
      }).platformId
    ).toBe("servicetitan");
  });

  it("recommends Housecall Pro for scheduling or dispatch pain", () => {
    expect(
      recommendHvacSoftware({
        teamSize: "2-5",
        biggestHeadache: "scheduling",
        monthlyRevenueRange: "$50k-$100k"
      }).platformId
    ).toBe("housecall-pro");
  });

  it("recommends Jobber for smaller invoicing-focused teams", () => {
    expect(
      recommendHvacSoftware({
        teamSize: "1",
        biggestHeadache: "invoicing",
        monthlyRevenueRange: "Under $50k"
      }).platformId
    ).toBe("jobber");
  });
});
