import { describe, expect, it } from "vitest";
import demoTenant from "@ble/tenant-demo";
import { getClientTrackingConfig } from "./index";

describe("getClientTrackingConfig", () => {
  it("exposes tenant client pixel configuration", () => {
    expect(getClientTrackingConfig(demoTenant).gtmContainerId).toBe("GTM-DEMO");
    expect(getClientTrackingConfig(demoTenant).eventMappings.LeadCompleted?.meta).toBe("Lead");
  });
});
