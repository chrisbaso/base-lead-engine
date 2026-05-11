import { describe, expect, it } from "vitest";
import { getTenantConfig, listTenantConfigs, resolveTenantSlug } from "./index";

describe("tenant-config", () => {
  it("lists registered tenants", () => {
    expect(listTenantConfigs().map((tenant) => tenant.identity.slug)).toEqual([
      "demo",
      "hvac-ops-pro",
      "retirement",
      "smart-retirement-mn"
    ]);
    expect(getTenantConfig("demo").identity.slug).toBe("demo");
    expect(getTenantConfig("hvac-ops-pro").identity.name).toBe("HVAC Ops Pro");
    expect(getTenantConfig("retirement").identity.slug).toBe("retirement");
    expect(getTenantConfig("smart-retirement-mn").compliance?.firmName).toBe("Smart Retirement MN");
  });

  it("resolves hostnames with ports", () => {
    expect(resolveTenantSlug("localhost:3000")).toBe("demo");
  });
});
